import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
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
import TopBar from "../components/TopBar";
import {
  setQueries,
  setSearch,
  setSort,
  toggleSelect,
  toggleSelectAll,
  setSelectedQuery,
  deleteQueries,
} from "../features/queriesSlice";
import { toggleSidebar as toggleSidebarAction } from "../features/uiSlice";

export default function CustomerQueries() {
  const dispatch = useDispatch();
  const { collapsed } = useSidebar();

  // Redux state
  const {
    queries,
    loading,
    search,
    sort,
    selectedIds,
    selectAll,
    selectedQuery,
  } = useSelector((state) => state.queries);
  const { isOpen } = useSelector((state) => state.ui);

  // 🔥 Fetch Queries with real-time listener
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

      // Filter out deleted ones before setting state
      dispatch(setQueries(queryList.filter((q) => q.deleted !== 1)));
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [dispatch]);

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
      dispatch(deleteQueries(ids));
    }
  };

  // ✅ Handle single view
  const handleView = (query) => dispatch(setSelectedQuery(query));
  const closeModal = () => dispatch(setSelectedQuery(null));

  // 🔍 Filter + Sort
  const filtered = queries
    .filter((q) => {
      try {
        const name = (q?.name || "").toString().toLowerCase();
        const email = (q?.email || "").toString().toLowerCase();
        const phone = (q?.phone || "").toString().toLowerCase();
        const searchText = (search || "").toLowerCase().trim();

        return (
          name.includes(searchText) ||
          email.includes(searchText) ||
          phone.includes(searchText)
        );
      } catch (error) {
        console.error("Filter error for query:", q, error);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        switch (sort) {
          case "Oldest First":
            return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
          default:
            return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
        }
      } catch (error) {
        console.error("Sort error:", error);
        return 0;
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
      <Header toggleSidebar={() => dispatch(toggleSidebarAction())} />
      <Sidebar
        barStatus={isOpen ? "active-menu" : "inactive-menu"}
        customerQueries="active"
      />

      <section className={`mainsection ${collapsed ? "collapsed" : ""}`}>
        <div className="tables-section">
          <TopBar
            search={search}
            inpchange={(e) => dispatch(setSearch(e.target.value))}
            sort={sort}
            selchange={(e) => dispatch(setSort(e.target.value))}
            delete={() => handleDelete(selectedIds)}
            length={selectedIds.length}
            addwidth="20%"
            delwidth="25%"
            data={selectedIds.length}
            display="none"
            page="queries"
            searchBy="🔍 Search by name, email, or phone..."
          />
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={() =>
                        dispatch(toggleSelectAll(filtered.map((q) => q.id)))
                      }
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Received At</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-orders">
                      No matching item found..
                    </td>
                  </tr>
                ) : (<>

                  {filtered.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(q.id)}
                          onChange={() => dispatch(toggleSelect(q.id))}
                        />
                      </td>
                      <td>{q.name}</td>
                      <td>{q.email}</td>
                      <td>{q.phone}</td>
                      <td>{q.createdAt}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleView(q)}
                          className="query-view-btn"
                        >
                          <img src={Details} alt="👁️" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />

      {/* 💬 Modal for Full Query */}
      {selectedQuery && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="section-top">
              <h2>Customer Query</h2>
            </div>

            <div className="section-modal">
              <div className="section-left">
                <table className="query-details-table">
                  <tbody>
                    <tr>
                      <td>
                        <strong>Name:</strong>
                      </td>
                      <td>{selectedQuery.name}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Email:</strong>
                      </td>
                      <td>{selectedQuery.email}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Phone:</strong>
                      </td>
                      <td>{selectedQuery.phone}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Received At:</strong>
                      </td>
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
