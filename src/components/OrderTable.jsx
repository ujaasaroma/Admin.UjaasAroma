import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../config/firebase";
import { FiFileText } from "react-icons/fi";
import {
  setOrders,
  toggleSelectOrder,
  toggleSelectAllOrders,
  setSelectedOrder,
} from "../features/ordersSlice";
import "./styles/OrderTable.css";

const OrdersTable = ({ orderType }) => {
  const dispatch = useDispatch();

  // Redux state
  const { allOrders, loading, selectedOrderIds, selectAll } = useSelector(
    (state) => state.orders
  );

  // 🔥 Real-time listener for orders
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

  // 🔍 Filter orders based on orderType
  const filteredOrders = useMemo(() => {
    if (!orderType) return allOrders;
    return allOrders.filter(
      (order) => order.status?.toLowerCase() === orderType.toLowerCase()
    );
  }, [allOrders, orderType]);

  // Handle view invoice
  const handleViewInvoice = (invoiceUrl) => {
    if (!invoiceUrl) return;
    const url = `https://firebasestorage.googleapis.com/v0/b/ujaas-aroma.firebasestorage.app/o/${encodeURIComponent(
      invoiceUrl
    )}?alt=media`;
    window.open(url, "_blank", "noopener,noreferrer");
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
                  dispatch(
                    toggleSelectAllOrders(filteredOrders.map((o) => o.id))
                  )
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
                <td>
                  <span
                    className={`status-chip ${
                      order.status?.toLowerCase() || ""
                    }`}
                  >
                    {order.status || "-"}
                  </span>
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
