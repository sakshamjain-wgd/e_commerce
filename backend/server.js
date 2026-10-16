const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Mount your modular routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running and connected to DB' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});