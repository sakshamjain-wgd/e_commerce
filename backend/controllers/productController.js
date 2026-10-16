const db = require('../db');

exports.getAllProducts = (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.createProduct = (req, res) => {
    const { name, sku, price, stock_quantity } = req.body;
    
    if (!name || !sku || price == null || stock_quantity == null) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `INSERT INTO products (name, sku, price, stock_quantity) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, sku, price, stock_quantity], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'SKU already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, sku, price, stock_quantity });
    });
};

exports.updateStock = (req, res) => {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity == null || stock_quantity < 0) {
        return res.status(400).json({ error: 'Invalid stock quantity' });
    }

    const sql = `UPDATE products SET stock_quantity = ? WHERE id = ?`;
    db.run(sql, [stock_quantity, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
        
        res.json({ message: 'Stock updated successfully', id, stock_quantity });
    });
};