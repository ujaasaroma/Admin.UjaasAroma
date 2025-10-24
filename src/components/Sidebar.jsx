import { useState } from "react";
import "./styles/Sidebar.css";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ barStatus }) => {
  const navigate = useNavigate();
  const [openOrders, setOpenOrders] = useState(false);
  const [status, setStatus] = useState(0)

  const toggleOrders = () => setOpenOrders((prev) => !prev);

  const handleProducts = () => {
    setStatus(1);
    navigate('/products');
  }

  return (
    <aside className={`sidebar ${barStatus}`}>
      <nav className="menu">
        <div className={`menu-item ${status === 0 ? 'active' : ''}`} onClick={()=> setStatus(0)}>
          <span>🏠</span> <span>Dashboard</span>
        </div>

        <div className={`menu-item ${status === 1 ? 'active' : ''}`} onClick={()=> handleProducts()}>
          <span>📂</span> <span>Products</span>
        </div>

        <div className={`menu-item ${openOrders ? "open" : ""}`} onClick={toggleOrders}>
          <span>💈</span> <span>Orders ▾</span>
        </div>

        {openOrders && (
          <div className="submenu">
            <div className={`menu-item ${status === 2.1 ? 'active' : ''}`} onClick={()=> setStatus(2.1)}><span>✅</span> <span>Success Orders</span></div>
            <div className={`menu-item ${status === 2.2 ? 'active' : ''}`} onClick={()=> setStatus(2.2)}><span>❌</span> <span>Failed Orders</span></div>
          </div>
        )}

        <div className={`menu-item ${status === 3 ? 'active' : ''}`} onClick={()=> setStatus(3)}>
          <span>📅</span> <span>Customer Queries</span>
        </div>

        <div className={`menu-item ${status === 4 ? 'active' : ''}`} onClick={()=> setStatus(4)}>
          <span>👥</span> <span>Users</span>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
