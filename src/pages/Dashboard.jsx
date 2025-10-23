import React, { useState } from "react";
import "../styles/Dashboard.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Dashboard = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <div className="dashboard-container">

            {/* Main Content */}
            <main className="main-content">
                <Header toggleSidebar={toggleSidebar} />
                <div style={{ display: 'flex' }}>
                    <Sidebar barStatus={isOpen ? 'active-menu' : 'inactive-menu'} />
                    <section className="content">
                        <div className="money-card">
                            <div className="money-sub-card">
                                <div className="money-info">
                                    <p className="money-title">Total Users</p>
                                    <h2 className="money-amount">$53k</h2>
                                </div>
                                <div className="money-icon">
                                    <i className="fa-solid fa-briefcase"></i>
                                </div>
                            </div>
                            <p className="money-change"><strong>+55%</strong> less than last week</p>
                        </div>

                       
                    </section>
                </div>

                <footer className="footer">
                    © Ujaas Aroma Inc. All rights reserved 2026.
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;
