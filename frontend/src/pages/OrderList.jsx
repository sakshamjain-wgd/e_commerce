import { useState, useEffect } from 'react';
import api from '../api';

export default function OrderList() {
    const [orders, setOrders] = useState([]);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleOrderDetails = async (id) => {
        if (expandedOrder?.id === id) {
            setExpandedOrder(null);
            return;
        }
        try {
            const { data } = await api.get(`/orders/${id}`);
            setExpandedOrder(data);
        } catch (err) {
            alert('Failed to load order details');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) return;
        try {
            await api.post(`/orders/${id}/cancel`);
            fetchOrders();
            if (expandedOrder?.id === id) setExpandedOrder(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel order');
        }
    };

    return (
        <div>
            <h2>Order History</h2>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #ccc' }}>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td>{o.id}</td>
                            <td>{o.customer_name}</td>
                            <td>{new Date(o.created_at).toLocaleString()}</td>
                            <td>${o.total_amount.toFixed(2)}</td>
                            <td>
                                <span style={{ color: o.status === 'Cancelled' ? 'red' : 'green' }}>{o.status}</span>
                            </td>
                            <td>
                                <button onClick={() => toggleOrderDetails(o.id)}>View Details</button>
                                {o.status !== 'Cancelled' && (
                                    <button onClick={() => handleCancel(o.id)} style={{ marginLeft: '10px', color: 'red' }}>Cancel</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {expandedOrder && (
                <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', background: '#f9f9f9' }}>
                    <h3>Order #{expandedOrder.id} Details</h3>
                    <ul>
                        {expandedOrder.items.map(item => (
                            <li key={item.id}>
                                {item.name} (SKU: {item.sku}) - {item.quantity} x ${item.price.toFixed(2)} =${(item.quantity * item.price).toFixed(2)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}