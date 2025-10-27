import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import "./styles/Products.css";
import "./styles/CustomerQueries.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProductSkeleton from "../components/ProductSkeleton";
import { useSidebar } from "../context/SidebarContext";
import Swal from "sweetalert2";
import Details from "../assets/icons/details.png";

export default function CustomerQueries() {
  const [isOpen, setIsOpen] = useState(false);
  const [queries, setQueries] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // ✅ Track selected IDs
  const [selectAll, setSelectAll] = useState(false); // ✅ Track header checkbox
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Most Recent");
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const { collapsed } = useSidebar();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // 🔥 Fetch Queries
  useEffect(() => {
    const q = query(
      collection(db, "mobileAppContactFormQueries"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const queryList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown",
          email: data.email || "N/A",
          phone: data.phone || "-",
          message: data.message || "No message provided",
          userId: data.userId || "-",
          deleted: data.deleted || 0,
          createdAt: data.createdAt?.toDate
            ? (() => {
              const date = data.createdAt.toDate();
              const datePart = date.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              });
              const timePart = date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
              return `${datePart} @ ${timePart}`;
            })()
            : "",
        };
      });

      // filter out deleted ones before setting state
      setQueries(queryList.filter((q) => q.deleted !== 1));
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);


  // ✅ Handle individual selection
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ Handle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((q) => q.id));
    }
    setSelectAll(!selectAll);
  };

  // ✅ Handle delete (single or multiple)
  const handleDelete = async (ids) => {
    if (!ids.length) return;

    const result = await Swal.fire({
      title:
        ids.length > 1
          ? `Delete ${ids.length} selected queries?`
          : "Delete this query?",
      text: `Deletion is permanent, it can't be restored later..`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
    });

    if (result.isConfirmed) {
      try {
        for (const id of ids) {
          await updateDoc(doc(db, "mobileAppContactFormQueries", id), { deleted: 1 });
        }

        setQueries((prev) => prev.filter((q) => !ids.includes(q.id)));
        setSelectedIds([]);
        setSelectAll(false);

        Swal.fire("Deleted!", "Selected queries were deleted.", "success");
      } catch (error) {
        console.error("Error deleting queries:", error);
        Swal.fire("Error", "Failed to delete queries.", "error");
      }
    }
  };

  // ✅ Handle single view
  const handleView = (query) => setSelectedQuery(query);
  const closeModal = () => setSelectedQuery(null);

  // 🔍 Filter + Sort
  const filtered = queries
    .filter((q) =>
      [q.name, q.email, q.phone]
        .some((val) =>
          val.toLowerCase().includes(search.toLowerCase().trim())
        )
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
      <Sidebar
        barStatus={isOpen ? "active-menu" : "inactive-menu"}
        customerQueries="active"
      />

      <section className={`mainsection ${collapsed ? "collapsed" : ""}`}>
        <div className="tables-section">
          <div className="top-bar">
            <input
              type="text"
              placeholder="🔍 Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="filter-sort filter-sort-queries">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Most Recent</option>
                <option>Oldest First</option>
              </select>
              {selectedIds.length > 0 && (<>
                <button className="delete-selected-btn query-del-btn" onClick={() => handleDelete(selectedIds)} >
                  <small><i className="fa-solid fa-trash"></i> Delete</small>
                  <small>({selectedIds.length})</small>
                </button>
              </>
              )}
            </div>
          </div>

          <table className="product-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Received At</th>
                <th style={{textAlign:'center'}}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(q.id)}
                      onChange={() => toggleSelect(q.id)}
                    />
                  </td>
                  <td>{q.name}</td>
                  <td>{q.email}</td>
                  <td>{q.phone}</td>
                  <td>{q.createdAt}</td>
                  <td style={{textAlign:'center'}}>
                    <button onClick={() => handleView(q)} className="query-view-btn">
                      <img src={Details} alt="👁️" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Footer />

      {/* 💬 Modal for Full Query */}
      {selectedQuery && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
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
                      <td>{selectedQuery.createdAt}</td>
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
            <button className="button-86" role="button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
