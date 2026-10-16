const db = require('../db');
const util = require('util');

const dbGet = util.promisify(db.get.bind(db));
const dbRun = util.promisify(db.run.bind(db));
const dbAll = util.promisify(db.all.bind(db));

exports.createOrder = async (req, res) => {
    const { customer_name, items } = req.body; 

    if (!customer_name || !items || items.length === 0) {
        return res.status(400).json({ error: 'Customer name and items are required' });
    }

    for (const item of items) {
        if (item.quantity <= 0) {
            return res.status(400).json({ error: 'Quantities must be greater than zero' });
        }
    }

    try {
        await dbRun('BEGIN TRANSACTION');

        let total_amount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await dbGet('SELECT * FROM products WHERE id = ?', [item.product_id]);
            
            if (!product) {
                await dbRun('ROLLBACK');
                return res.status(400).json({ error: `Product ID ${item.product_id} does not exist` });
            }

            if (product.stock_quantity < item.quantity) {
                await dbRun('ROLLBACK');
                return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
            }

            total_amount += product.price * item.quantity;
            processedItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price: product.price
            });
        }

        const orderId = await new Promise((resolve, reject) => {
            db.run('INSERT INTO orders (customer_name, total_amount) VALUES (?, ?)', 
                [customer_name, total_amount], 
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        for (const item of processedItems) {
            await dbRun('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', 
                [item.quantity, item.product_id]
            );
            
            await dbRun('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await dbRun('COMMIT');
        res.status(201).json({ message: 'Order placed successfully', order_id: orderId, total_amount });

    } catch (error) {
        await dbRun('ROLLBACK');
        res.status(500).json({ error: 'Order processing failed: ' + error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await dbAll('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const items = await dbAll(`
            SELECT oi.*, p.name, p.sku 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        res.json({ ...order, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    const { id } = req.params;

    try {
        await dbRun('BEGIN TRANSACTION');

        const order = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            await dbRun('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'Cancelled') {
            await dbRun('ROLLBACK');
            return res.status(400).json({ error: 'Order is already cancelled' });
        }

        await dbRun('UPDATE orders SET status = ? WHERE id = ?', ['Cancelled', id]);

        const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [id]);
        for (const item of items) {
            await dbRun('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', 
                [item.quantity, item.product_id]
            );
        }

        await dbRun('COMMIT');
        res.json({ message: 'Order cancelled and stock restored successfully' });

    } catch (error) {
        await dbRun('ROLLBACK');
        res.status(500).json({ error: 'Cancellation failed: ' + error.message });
    }
};