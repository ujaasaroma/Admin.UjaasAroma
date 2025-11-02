import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./styles/Products.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProductSkeleton from "../components/ProductSkeleton";
import dummy_picture from "../assets/icons/dummy_profile_picture.png";
import { useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import TopBar from "../components/TopBar";
import {
  fetchUsers,
  setSearch,
  setFilter,
  setSort,
  setHovered,
  deleteUser,
} from "../features/usersSlice";
import { toggleSidebar as toggleSidebarAction } from "../features/uiSlice";
import Swal from "sweetalert2";

export default function Users() {
  const location = useLocation();
  const userType = location.state?.userType;
  const dispatch = useDispatch();
  const { collapsed } = useSidebar();

  // Redux state
  const { users, loading, search, filter, sort, hovered } = useSelector(
    (state) => state.users
  );
  const { isOpen } = useSelector((state) => state.ui);

  // Initialize filter based on userType from navigation state
  useEffect(() => {
    if (userType === "admins") {
      dispatch(setFilter("Admins"));
    } else if (userType === "clients") {
      dispatch(setFilter("Clients"));
    } else {
      dispatch(setFilter("All"));
    }
  }, [userType, dispatch]);

  // Fetch users on mount
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Handle delete with confirmation
  const handleDelete = async (id, userName) => {
    const result = await Swal.fire({
      title: `Delete ${userName}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
      customClass: { popup: "swal-popup-top" },
    });

    if (result.isConfirmed) {
      dispatch(deleteUser(id));
    }
  };

  const handleEdit = (id) => {
    // TODO: Implement edit functionality
    Swal.fire("Info", `Edit user ${id} - Coming soon!`, "info");
  };

  // 🔍 Filtering + Sorting
  const filtered = users
    .filter((u) => {
      try {
        const name = (u?.name || "").toString().toLowerCase();
        const email = (u?.email || "").toString().toLowerCase();
        const phone = (u?.phone || "").toString().toLowerCase();
        const createdAt = (u?.createdAt || "").toString().toLowerCase();
        const admin = (u?.admin || "").toString().toLowerCase();
        const searchText = (search || "").toLowerCase().trim();

        return (
          name.includes(searchText) ||
          email.includes(searchText) ||
          phone.includes(searchText) ||
          createdAt.includes(searchText) ||
          admin.includes(searchText)
        );
      } catch (error) {
        console.error("Filter error for user:", u, error);
        return false;
      }
    })
    .filter((u) => {
      if (filter === "Admins") return u?.admin === "Yes";
      if (filter === "Clients") return u?.admin === "No";
      return true;
    })
    .sort((a, b) => {
      try {
        switch (sort) {
          case "Name A-Z":
            return (a?.name || "").localeCompare(b?.name || "");
          case "Name Z-A":
            return (b?.name || "").localeCompare(a?.name || "");
          case "Newest First":
            return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
          case "Oldest First":
            return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
          default:
            return 0;
        }
      } catch (error) {
        console.error("Sort error:", error);
        return 0;
      }
    });

  // 💫 Shimmer while loading
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
        users="active"
      />
      <section className={`mainsection ${collapsed ? "collapsed" : ""}`}>
        <div className="tables-section">
          <TopBar
            search={search}
            inpchange={(e) => dispatch(setSearch(e.target.value))}
            filter={filter}
            filchange={(e) => dispatch(setFilter(e.target.value))}
            sort={sort}
            selchange={(e) => dispatch(setSort(e.target.value))}
            page="users"
            display="none"
            searchBy="🔍 Search users by name, email, phone"
          />
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Admin</th>
                  <th>Created At</th>
                  <th>Last Updated At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-orders">
                      No matching user found..
                    </td>
                  </tr>
                ) : (<>
                  {filtered.map((u, i) => (
                    <React.Fragment key={u.id}>
                      <tr
                        onMouseEnter={() => dispatch(setHovered(u.id))}
                        onMouseLeave={() => dispatch(setHovered(null))}
                      >
                        <td>{String(i + 1).padStart(2, "0")}</td>
                        <td>
                          <div className="product-name-cell">
                            <img
                              src={u.photoURL || dummy_picture}
                              alt={u.name}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span
                            className={`status ${u.admin === "Yes" ? "available" : "out"
                              }`}
                          >
                            {u.admin}
                          </span>
                        </td>

                        <td>{u.createdAt}</td>
                        <td>{u.updatedAt}</td>
                      </tr>

                      {/* Hover Card */}
                      {hovered === u.id && (
                        <div className="hover-card-cell">
                          <div className="hover-card">
                            <img src={u.photoURL || dummy_picture} alt={u.name} />
                            <h4>{u.name}</h4>
                            <p>
                              <strong>Email:</strong> {u.email}
                            </p>
                            <p>
                              <strong>Phone:</strong> {u.phone}
                            </p>
                            <p>
                              <strong>Admin:</strong> {u.admin}
                            </p>
                            <p>
                              <strong>Created At:</strong> {u.createdAt}
                            </p>
                            <p>
                              <strong>Last Updated At:</strong> {u.updatedAt}
                            </p>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
