import { useState, useEffect } from 'react';
import api from '../api';

export default function CreateOrder() {
    const [products, setProducts] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        api.get('/products').then(res => setProducts(res.data)).catch(console.error);
    }, []);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);

    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            const product = products.find(p => p.id === parseInt(item.product_id));
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        
        const formattedItems = items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: parseInt(item.quantity)
        }));

        try {
            const { data } = await api.post('/orders', { customer_name: customerName, items: formattedItems });
            setMessage(`Success! Order ID: ${data.order_id} | Total: $${data.total_amount.toFixed(2)}`);
            setCustomerName('');
            setItems([{ product_id: '', quantity: 1 }]);
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.error || err.message}`);
        }
    };

    return (
        <div>
            <h2>Create Order</h2>
            {message && <p style={{ fontWeight: 'bold', color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
            
            <form onSubmit={handleSubmit} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" placeholder="Customer Name" required value={customerName} onChange={e => setCustomerName(e.target.value)} />
                
                {items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select required value={item.product_id} onChange={e => handleItemChange(index, 'product_id', e.target.value)}>
                            <option value="">Select a product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity}) - ${p.price}</option>
                            ))}
                        </select>
                        <input type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} style={{ width: '80px' }} />
                        {items.length > 1 && <button type="button" onClick={() => removeItem(index)}>Remove</button>}
                    </div>
                ))}
                
                <button type="button" onClick={addItem} style={{ alignSelf: 'flex-start' }}>+ Add Another Product</button>
                
                <h3>Estimated Total: ${calculateTotal().toFixed(2)}</h3>
                
                <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none' }}>Place Order</button>
            </form>
        </div>
    );
}