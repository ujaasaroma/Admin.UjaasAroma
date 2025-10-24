import React, { useState, useEffect } from "react";
import "./styles/Dashboard.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [adminUsers, setAdminUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [successOrders, setSuccessOrders] = useState(0);
  const [failedOrders, setFailedOrders] = useState(0);
  const [discountCodes, setDiscountCodes] = useState(0);
  const [mobileQueries, setMobileQueries] = useState(0);

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    // 🧍 Total (non-admin) users
    const userQuery = query(collection(db, "users"), where("admin", "==", 0));
    const unsubUser = onSnapshot(userQuery, (snapshot) => {
      setTotalUsers(snapshot.size);
      setLoading(false);
    });

    // 🛡️ Admin users
    const adminQuery = query(collection(db, "users"), where("admin", "==", 1));
    const unsubAdmin = onSnapshot(adminQuery, (snapshot) => {
      setAdminUsers(snapshot.size);
      setLoading(false);
    });

    // 🎁 Total products
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      setTotalProducts(snapshot.size);
      setLoading(false);
    });

    // ✅ Success orders
    const unsubSuccess = onSnapshot(collection(db, "successOrders"), (snapshot) => {
      setSuccessOrders(snapshot.size);
      setLoading(false);
    });

    // ❌ Failed orders
    const unsubFailed = onSnapshot(collection(db, "failedOrders"), (snapshot) => {
      setFailedOrders(snapshot.size);
      setLoading(false);
    });

    // 🎟️ Discount codes
    const unsubDiscount = onSnapshot(collection(db, "discountCodes"), (snapshot) => {
      setDiscountCodes(snapshot.size);
      setLoading(false);
    });

    // 📩 Mobile app contact form queries
    const unsubQueries = onSnapshot(
      collection(db, "mobileAppContactFormQueries"),
      (snapshot) => {
        setMobileQueries(snapshot.size);
        setLoading(false);
      }
    );

    // 🧹 Clean up all listeners
    return () => {
      unsubUser();
      unsubAdmin();
      unsubProducts();
      unsubSuccess();
      unsubFailed();
      unsubDiscount();
      unsubQueries();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <main className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ display: "flex" }}>
          <Sidebar barStatus={isOpen ? "active-menu" : "inactive-menu"} />
          <section className="content">
            {/* 🛡️ Admin Users */}
            <div className="money-card">
              <div className="money-sub-card">
                <div className="money-info">
                  <p className="money-title">Admin Users</p>
                  <h2 className="money-amount">
                    {loading ? "..." : adminUsers}
                  </h2>
                </div>
                <div className="money-icon">
                  <i className="fa-solid fa-user-shield"></i>
                </div>
              </div>
              <p className="money-change">Verified admins</p>
            </div>

            {/* 🧍 Total Users */}
            <div className="money-card">
              <div className="money-sub-card">
                <div className="money-info">
                  <p className="money-title">Total Users</p>
                  <h2 className="money-amount">
                    {loading ? "..." : totalUsers}
                  </h2>
                </div>
                <div className="money-icon">
                  <i className="fa-solid fa-users"></i>
                </div>
              </div>
              <p className="money-change">Registered users</p>
            </div>

            {/* 🎁 Total Products */}
            <div className="money-card">
              <div className="money-sub-card">
                <div className="money-info">
                  <p className="money-title">Total Products</p>
                  <h2 className="money-amount">
                    {loading ? "..." : totalProducts}
                  </h2>
                </div>
                <div className="money-icon">
                  <i className="fa-solid fa-gift"></i>
                </div>
              </div>
              <p className="money-change">All handmade products</p>
            </div>

            {/* ✅ Success Orders */}
            <div className="money-card">
              <div className="money-sub-card">
                <div className="money-info">
                  <p className="money-title">Success Orders</p>
                  <h2 className="money-amount">
                    {loading ? "..." : successOrders}
                  </h2>
                </div>
                <div className="money-icon">
                  <i className="fa-solid fa-check-circle"></i>
                </div>
              </div>
              <p className="money-change">Completed successfully</p>
            </div>

            {/* ❌ Failed Orders */}
            <div className="money-card">
              <div className="money-sub-card">
                <div className="money-info">
                  <p className="money-title">Failed Orders</p>
                  <h2 className="money-amount">
                    {loading ? "..." : failedOrders}
                  </h2>
                </div>
                <div className="money-icon">
                  <i className="fa-solid fa-xmark-circle"></i>
                </div>
              </div>
              <p className="money-change">Payment or delivery issues</p>
            </div>

            {/* 🎟️ Discount Codes */}
            <div className="money-card">
              <div className="money-sub-card">
                <div className="money-info">
                  <p className="money-title">Discount Codes</p>
                  <h2 className="money-amount">
                    {loading ? "..." : discountCodes}
                  </h2>
                </div>
                <div className="money-icon">
                  <i className="fa-solid fa-tags"></i>
                </div>
              </div>
              <p className="money-change">Active promotional codes</p>
            </div>

            {/* 📩 Mobile Queries */}
            <div className="money-card">
              <div className="money-sub-card">
                <div className="money-info">
                  <p className="money-title">Customer Queries</p>
                  <h2 className="money-amount">
                    {loading ? "..." : mobileQueries}
                  </h2>
                </div>
                <div className="money-icon">
                  <i className="fa-solid fa-envelope"></i>
                </div>
              </div>
              <p className="money-change">Messages from app</p>
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
