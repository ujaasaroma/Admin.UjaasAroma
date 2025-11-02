import { useState, useEffect, useRef } from "react";
import "./styles/Sidebar.css";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSidebar } from "../context/SidebarContext";


const Sidebar = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openOrders, setOpenOrders] = useState(false);
  const [status, setStatus] = useState(0);
  const { collapsed, setCollapsed } = useSidebar();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef(null);

  // ✅ Load persisted collapse state
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // ✅ Save collapse state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  // ✅ Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const toggleCollapse = () => setCollapsed((prev) => !prev);

  const handleDashboard = () => {
    setStatus(0);
    navigate("/dashboard");
  };

  const handleProducts = () => {
    setStatus(1);
    navigate("/products");
  };

  const handleOrders = () => {
    setStatus(2);
    navigate("/orders");
  };

  const handleCustomerQueries = () => {
    setStatus(3);
    navigate("/queries");
  };

  const handleUsers = () => {
    setStatus(4);
    navigate("/users");
  };

  return (
    <aside
      className={`sidebar ${props.barStatus} ${collapsed ? "collapsed" : ""
        }`}
    >
      {/* Collapse / Expand Button */}
      <div className="collapse-toggle" onClick={toggleCollapse}>
        <i
          className={`fa-solid ${collapsed ? "fa-angles-right" : "fa-angles-left"
            }`}
        ></i>
      </div>

      <nav className="menu">
        {/* Dashboard */}
        <div
          className={`menu-item ${props.dashboard}`}
          style={{ flexDirection: collapsed ? 'column' : 'row' }}
          data-title="Dashboard"
          onClick={handleDashboard}
        >
          <i className="fa-solid fa-house-user"></i>
          {collapsed && <small>Dashboard</small>}
          {!collapsed && <span>Dashboard</span>}
        </div>

        {/* Products */}
        <div
          className={`menu-item ${props.products}`}
          style={{ flexDirection: collapsed ? 'column' : 'row' }}
          data-title="Products"
          onClick={handleProducts}
        >
          <i className="fa-solid fa-folder-closed"></i>
          {collapsed && <small>Products</small>}
          {!collapsed && <span>Products</span>}
        </div>

        {/* Orders */}
        <div
          className={`menu-item ${props.orders}`}
          style={{ flexDirection: collapsed ? 'column' : 'row' }}
          data-title="Orders"
          onClick={handleOrders}
        >
          <i className="fa-solid fa-list"></i>
          {collapsed && <small>Orders</small>}
          {!collapsed && <span>Orders</span>}
        </div>

        {/* Customer Queries */}
        <div
          className={`menu-item ${props.customerQueries}`}
          style={{ flexDirection: collapsed ? 'column' : 'row' }}
          data-title="Customer Queries"
          onClick={handleCustomerQueries}
        >
          <i className="fa-solid fa-calendar-days"></i>
          {collapsed && <small>Queries</small>}
          {!collapsed && <span>Customer Queries</span>}
        </div>

        {/* Users */}
        <div
          className={`menu-item ${props.users}`}
          style={{ flexDirection: collapsed ? 'column' : 'row' }}
          data-title="Users"
          onClick={handleUsers}
        >
          <i className="fa-solid fa-users"></i>
          {collapsed && <small>Users</small>}
          {!collapsed && <span>Users</span>}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
