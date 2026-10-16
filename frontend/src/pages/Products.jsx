import { useState, useEffect } from 'react';
import api from '../api';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', stock_quantity: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/products', {
                ...newProduct,
                price: parseFloat(newProduct.price),
                stock_quantity: parseInt(newProduct.stock_quantity, 10)
            });
            setNewProduct({ name: '', sku: '', price: '', stock_quantity: '' });
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add product');
        }
    };

    const handleUpdateStock = async (id, currentStock) => {
        const newStock = prompt('Enter new stock quantity:', currentStock);
        if (newStock === null || newStock === '') return;
        
        const parsedStock = parseInt(newStock, 10);
        if (parsedStock < 0 || isNaN(parsedStock)) {
            alert('Invalid stock quantity');
            return;
        }

        try {
            await api.put(`/products/${id}/stock`, { stock_quantity: parsedStock });
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update stock');
        }
    };

    return (
        <div>
            <h2>Products & Inventory</h2>
            
            <form onSubmit={handleAddProduct} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd' }}>
                <h3>Add New Product</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Name" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    <input type="text" placeholder="SKU" required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Price" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                    <input type="number" placeholder="Stock" required value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} />
                    <button type="submit">Add Product</button>
                </div>
            </form>

            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #ccc' }}>
                        <th>ID</th>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.sku}</td>
                            <td>${p.price.toFixed(2)}</td>
                            <td>{p.stock_quantity}</td>
                            <td>
                                <button onClick={() => handleUpdateStock(p.id, p.stock_quantity)}>Update Stock</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}