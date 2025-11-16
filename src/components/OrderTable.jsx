// src/components/OrdersTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { collection, onSnapshot, query, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { FiFileText } from "react-icons/fi";
import Swal from "sweetalert2";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const storage = getStorage();

import {
  setOrders,
  toggleSelectOrder,
  toggleSelectAllOrders,
} from "../features/ordersSlice";

import "./styles/OrderTable.css";

const OrdersTable = ({ orderType }) => {
  const dispatch = useDispatch();

  const { allOrders, loading, selectedOrderIds, selectAll } = useSelector(
    (state) => state.orders
  );
  const [updatingStatus, setUpdatingStatus] = useState(null); // orderNumber that is updating

  // 🔥 Real-time listener
  useEffect(() => {
    const q = query(collection(db, "successOrders"));
    const unsub = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dispatch(setOrders(ordersList));
    });

    return () => unsub();
  }, [dispatch]);

  // 🔍 Filter orders
  const filteredOrders = useMemo(() => {
    if (!orderType) return allOrders;
    return allOrders.filter(
      (order) => order.status?.toLowerCase() === orderType.toLowerCase()
    );
  }, [allOrders, orderType]);

  // 📄 View Invoice
  const handleViewInvoice = async (invoiceUrl) => {
    try {
      if (!invoiceUrl) return;

      // 🔥 Create a Storage reference from the stored path
      const fileRef = ref(storage, invoiceUrl);

      // 🔥 This automatically applies Firebase authentication tokens
      const secureUrl = await getDownloadURL(fileRef);

      window.open(secureUrl, "_blank", "noopener,noreferrer");

    } catch (error) {
      console.error("Error fetching invoice URL:", error);
      Swal.fire({
        icon: "error",
        title: "Unable to Load Invoice",
        text: "This file requires authentication. Please try again.",
        confirmButtonColor: "#000",
      });
    }
  };

  // 📌 Update Order Status (Admin only)
  const updateOrderStatus = async (order, newStatus) => {
    if (order.status === newStatus) return;

    if (order.status === "delivered") {
      Swal.fire({
        icon: "info",
        title: "Locked",
        text: "Delivered orders cannot be updated.",
        confirmButtonColor: "#000",
      });
      return;
    }
    if (newStatus === "delivered") {
      const confirm = await Swal.fire({
        title: "Mark Order as Delivered?",
        text: "Once marked as Delivered, you will not be able to change the status again.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "I am Sure..",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#d33",
      });

      if (!confirm.isConfirmed) {
        return; // user cancelled
      }
    }

    setUpdatingStatus(order.orderNumber);

    try {
      await updateDoc(doc(db, "successOrders", order.orderNumber), {
        status: newStatus,
        updatedAt: new Date(),
      });

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Order marked as ${newStatus}`,
        confirmButtonColor: "#000",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to update status. Try again later.",
        confirmButtonColor: "#000",
      });
    }

    setUpdatingStatus(null);
  };

  return (
    <div className="orders-table-container">
      <table className="orders-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={() =>
                  dispatch(toggleSelectAllOrders(filteredOrders.map((o) => o.id)))
                }
              />
            </th>
            <th>Order No</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="10" className="no-orders">
                {loading
                  ? "Loading orders..."
                  : `No ${orderType || ""} orders found.`}
              </td>
            </tr>
          ) : (
            filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.id)}
                    onChange={() => dispatch(toggleSelectOrder(order.id))}
                  />
                </td>

                <td>{order.orderNumber || "-"}</td>
                <td>{order.customerInfo?.name || "-"}</td>
                <td>{order.customerInfo?.email || "-"}</td>
                <td>{order.customerInfo?.phone || "-"}</td>

                <td>₹{order.total?.toFixed(2) || "0.00"}</td>

                <td>{order.payment?.status || "-"}</td>

                {/* STATUS + ADMIN DROPDOWN */}
                <td>
                  {order.status === "delivered" ? (
                    // 🔒 Delivered is locked
                    <span className="status-chip delivered">delivered</span>
                  ) : (
                    <div className="status-dropdown">
                      <button className={`status-btn ${order.status}`}>
                        {updatingStatus === order.orderNumber ? (
                          <div className="spinner" />
                        ) : (
                          order.status
                        )}
                      </button>

                      <div className="dropdown-content">
                        <div
                          className="dropdown-item"
                          onClick={() => updateOrderStatus(order, "processing")}
                        >
                          Processing
                        </div>
                        <div
                          className="dropdown-item"
                          onClick={() => updateOrderStatus(order, "delivered")}
                        >
                          Delivered
                        </div>
                        <div
                          className="dropdown-item"
                          onClick={() => updateOrderStatus(order, "cancelled")}
                        >
                          Cancelled
                        </div>
                      </div>
                    </div>
                  )}
                </td>

                <td>{order.orderDate || "-"}</td>

                <td className="actions-cell">
                  {order.invoiceUrl ? (
                    <button
                      onClick={() => handleViewInvoice(order.invoiceUrl)}
                      className="invoice-btn"
                      title="View Invoice"
                    >
                      <FiFileText className="action-icon" />
                    </button>
                  ) : (
                    <FiFileText className="action-icon disabled" />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
