import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import "../styles/AdminResetLogs.css";

export default function AdminResetLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    const logsRef = collection(db, "resetLogs");

    let constraints = [];
    if (filter !== "all") constraints.push(where("status", "==", filter));

    // ⏰ Apply date filters
    const now = new Date();
    let startDate = null;
    if (dateRange === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (dateRange === "7days") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (dateRange === "30days") {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (dateRange === "custom" && customStart && customEnd) {
      startDate = new Date(customStart);
      const endDate = new Date(customEnd);
      constraints.push(
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate))
      );
    }

    if (startDate && dateRange !== "custom") {
      constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }

    const q = query(logsRef, ...constraints, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, dateRange, customStart, customEnd]);

  const filteredLogs = logs.filter((log) =>
    log.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="reset-logs-container">
      <div className="reset-logs-header">
        <h2>Password Reset Logs</h2>

        <div className="reset-logs-controls">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="reset-search-input"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="reset-filter-select"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="error">Error</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="reset-filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === "custom" && (
            <div className="date-range-inputs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="reset-loading">Loading logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="reset-empty">No logs found for this range.</p>
      ) : (
        <table className="reset-logs-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>IP</th>
              <th>Timestamp</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.email}</td>
                <td>
                  <span className={`status-badge status-${log.status}`}>
                    {log.status}
                  </span>
                </td>
                <td>{log.ip || "N/A"}</td>
                <td>
                  {log.timestamp?.toDate
                    ? log.timestamp.toDate().toLocaleString()
                    : "N/A"}
                </td>
                <td className="error-cell">
                  {log.error ? (
                    <span title={log.error}>{log.error}</span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
