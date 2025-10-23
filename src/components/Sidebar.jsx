
import "./styles/Sidebar.css";

const Sidebar = ({barStatus}) => {
  
  return (
    <aside className={`sidebar ${barStatus}`} >
      <nav className="menu">
        <div className="menu-item active"><span>🏠</span> <span>Dashboard</span></div>
        <div className="menu-item"><span>📂</span> <span>Categories</span></div>
        <div className="menu-item"><span>💈</span> <span>Services</span></div>
        <div className="menu-item"><span>📅</span> <span>Appointments</span></div>
      </nav>
    </aside>
  )
};

export default Sidebar;
