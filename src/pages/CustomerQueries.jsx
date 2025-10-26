import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../config/firebase";
import "./styles/Products.css";
import "./styles/CustomerQueries.css"
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProductSkeleton from "../components/ProductSkeleton";

export default function CustomerQueries() {
  const [isOpen, setIsOpen] = useState(false);
  const [queries, setQueries] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Most Recent");
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null); // 💬 For modal

  const toggleSidebar = () => setIsOpen(!isOpen);

  // 🔥 Fetch Queries
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const q = query(
          collection(db, "mobileAppContactFormQueries"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        const queryList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "N/A",
            phone: data.phone || "-",
            message: data.message || "No message provided",
            userId: data.userId || "-",
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : "",
          };
        });

        setQueries(queryList);
      } catch (error) {
        console.error("Error fetching customer queries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  const handleDelete = (id) => alert(`Delete query ${id}`);
  const handleView = (query) => setSelectedQuery(query); // 👁️ open modal
  const closeModal = () => setSelectedQuery(null); // close modal

  // 🔍 Filter + Sort
  const filtered = queries
    .filter((q) =>
      [q.name, q.email, q.phone]
        .some((val) => val.toLowerCase().includes(search.toLowerCase().trim()))
    )
    .sort((a, b) => {
      switch (sort) {
        case "Oldest First":
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // 💫 Shimmer
  if (loading) {
    return (
      <div className="loading-shimmer">
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <ProductSkeleton />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="products-container">
      <Header toggleSidebar={toggleSidebar} />
      <div className="sidebar-mainsection">
        <Sidebar
          barStatus={isOpen ? "active-menu" : ""}
          customerQueries="active"
        />
        <section className="mainsection">
          <div className="section tables-section">
            <div className="top-bar">
              <input
                type="text"
                placeholder="🔍 Search by name, email, or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="filter-sort" style={{ width: '20%' }}>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option>Most Recent</option>
                  <option>Oldest First</option>
                </select>
              </div>
            </div>

            <table className="product-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Message</th>
                  <th>Received At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q, i) => (
                  <tr key={q.id}>
                    <td>{String(i + 1).padStart(2, "0")}</td>
                    <td>{q.name}</td>
                    <td>{q.email}</td>
                    <td>{q.phone}</td>
                    <td className="truncate-text">
                      {q.message.length > 25
                        ? q.message.substring(0, 25) + "..."
                        : q.message}
                    </td>
                    <td>{q.createdAt}</td>
                    <td className="actions">
                      <button onClick={() => handleView(q)}>👁️</button>
                      <button onClick={() => handleDelete(q.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Footer />

      {/* 💬 Modal for Full Query */}
      {selectedQuery && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // prevent close on inside click
          >
            <div className="section-top">
              <h2>Customer Query</h2>
            </div>

            <div className="section-modal">
              <div className="section-left">
                <table className="query-details-table">
                  <tbody>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{selectedQuery.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>{selectedQuery.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Phone:</strong></td>
                      <td>{selectedQuery.phone}</td>
                    </tr>
                    <tr>
                      <td><strong>Received At:</strong></td>
                      <td>{selectedQuery.createdAt?.toDate
                        ? selectedQuery.createdAt.toDate().toLocaleString()
                        : selectedQuery.createdAt}</td>
                    </tr>
                  </tbody>
                </table>

              </div>


              <div className="section-right">

                <p style={{ paddingLeft: 10 }}>
                  <strong>Message:</strong>
                </p>
                <p className="modal-message-box">{selectedQuery.message}</p>

              </div>
            </div>
            <button class="button-86" role="button" onClick={closeModal}>Close</button>

          </div>
        </div>
      )}
    </div>
  );
}
