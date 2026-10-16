import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Products from './pages/Products';
import CreateOrder from './pages/CreateOrder';
import OrderList from './pages/OrderList';

function App() {
  return (
    <Router>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <nav style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <Link to="/">Products & Inventory</Link>
          <Link to="/orders/new">Create Order</Link>
          <Link to="/orders">Order History</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/orders/new" element={<CreateOrder />} />
          <Route path="/orders" element={<OrderList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;