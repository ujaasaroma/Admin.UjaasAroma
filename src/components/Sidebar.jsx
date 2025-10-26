import { useState } from "react";
import "./styles/Sidebar.css";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const Sidebar = (props) => {
  const navigate = useNavigate();
  const [openOrders, setOpenOrders] = useState(false);
  const [status, setStatus] = useState(0)
  const dispatch = useDispatch();

  const toggleOrders = () => setOpenOrders((prev) => !prev);

  const handleDashboard = () => {
    setStatus(0);
    navigate('/dashboard');
  }

  const handleProducts = () => {
    setStatus(1);
    navigate('/products');
  }

  const handleCustomerQueries = () => {
    setStatus(3);
    navigate('/queries');
  }

  const handleUsers = () => {
    setStatus(4);
    navigate('/users');
  }

 

  return (
    <aside className={`sidebar ${props.barStatus}`}>
      <nav className="menu">
        <div className={`menu-item ${props.dashboard}`} onClick={() => handleDashboard()}>
          <i class="fa-solid fa-house-user"></i> <span>Dashboard</span>
        </div>

        <div className={`menu-item ${props.products}`} onClick={() => handleProducts()}>
          <i class="fa-solid fa-folder-closed"></i> <span>Products</span>
        </div>

        <div className={`menu-item ${openOrders ? "open" : ""}`} onClick={toggleOrders}>
          <i class="fa-solid fa-list"></i> <span>Orders ▾</span>
        </div>

        {openOrders && (
          <div className="submenu">
            <div className={`submenu-item ${status === 2.1 ? 'active' : ''}`} onClick={() => setStatus(2.1)}><i class="fa-solid fa-check" style={{ color: 'green', fontSize: 15, width: 20 }}></i> <span>Success Orders</span></div>
            <div className={`submenu-item ${status === 2.2 ? 'active' : ''}`} onClick={() => setStatus(2.2)}><i class="fa-solid fa-xmark" style={{ color: 'red', fontSize: 17, width: 20 }}></i> <span>Failed Orders</span></div>
          </div>
        )}

        <div className={`menu-item ${props.customerQueries}`} onClick={() => handleCustomerQueries()}>
          <i class="fa-solid fa-calendar-days"></i> <span>Customer Queries</span>
        </div>

        <div className={`menu-item ${props.users}`} onClick={() => handleUsers()}>
          <i class="fa-solid fa-users"></i> <span>Users</span>
        </div>

      </nav>
    </aside>
  );
};

export default Sidebar;
