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
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProductSkeleton from "../components/ProductSkeleton"; // shimmer component
import dummy_picture from "../assets/icons/dummy_profile_picture.png"
import { useLocation } from "react-router-dom";

export default function Users() {
    const location = useLocation();
    const userType = location.state?.userType;
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [search, setSearch] = useState("");
    const[filter, setFilter] = useState(
        userType === "admins" ? "Admins" : userType === "clients" ? "Clients" : "All"
    );

    const [sort, setSort] = useState("Most Relevant");
    const [loading, setLoading] = useState(true);

    const toggleSidebar = () => setIsOpen(!isOpen);

    // 🔥 Fetch Users from Firestore
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, "users"), orderBy("name"));
                const snapshot = await getDocs(q);

                const userList = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || "Unnamed User",
                        email: data.email || "N/A",
                        phone: data.phone || "-",
                        admin: data.admin === 1 || data.admin === true ? "Yes" : "No",
                        emailVerified: data.emailVerified ? "Verified" : "Not Verified",
                        photoURL: data.photoURL || null,
                        createdAt: data.createdAt?.toDate
                            ? data.createdAt.toDate().toLocaleDateString()
                            : "",
                    };
                });

                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDelete = (id) => alert(`Delete user ${id}`);
    const handleEdit = (id) => alert(`Edit user ${id}`);

    // 🔍 Filtering + Sorting
    const filtered = users
        .filter((u) =>
            u.name.toLowerCase().includes(search.toLowerCase().trim()) ||
            u.email.toLowerCase().includes(search.toLowerCase().trim()) ||
            u.phone.toLowerCase().includes(search.toLowerCase().trim()) ||
            u.createdAt.toLowerCase().includes(search.toLowerCase().trim()) ||
            u.admin.toLowerCase().includes(search.toLowerCase().trim())
        )
        .filter((u) => {
            if (filter === "Admins") return u.admin === "Yes";
            if (filter === "Clients") return u.admin === "No";
            return true;
        })
        .sort((a, b) => {
            switch (sort) {
                case "Name A-Z":
                    return a.name.localeCompare(b.name);
                case "Name Z-A":
                    return b.name.localeCompare(a.name);
                case "Newest First":
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case "Oldest First":
                    return new Date(a.createdAt) - new Date(b.createdAt);
                default:
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
            <Header toggleSidebar={toggleSidebar} />
            <div className="sidebar-mainsection">
                <Sidebar barStatus={isOpen ? "active-menu" : ""} users="active" />
                <section className="mainsection">
                    <div className="section tables-section">
                        <div className="top-bar">
                            <input
                                type="text"
                                placeholder="🔍 Search users by name, email, phone"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="filter-sort" style={{width:'20%'}}>
                                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                                    <option>All</option>
                                    <option>Admins</option>
                                    <option>Clients</option>
                                </select>
                                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                    <option>Most Relevant</option>
                                    <option>Name A-Z</option>
                                    <option>Name Z-A</option>
                                    <option>Newest First</option>
                                    <option>Oldest First</option>
                                </select>
                            </div>
                        </div>

                        <table className="product-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Admin</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <React.Fragment key={u.id}>
                                        <tr
                                            onMouseEnter={() => setHovered(u.id)}
                                            onMouseLeave={() => setHovered(null)}
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
                                                <span className={`status ${u.admin === "Yes" ? "available" : "out"}`}>
                                                    {u.admin}
                                                </span>
                                            </td>

                                            <td>{u.createdAt}</td>
                                            <td className="actions">
                                                <button onClick={() => handleEdit(u.id)}>✏️</button>
                                                <button onClick={() => handleDelete(u.id)}>🗑️</button>
                                            </td>
                                        </tr>

                                        {/* Hover Card */}
                                        {hovered === u.id && (
                                            <div className="hover-card-cell">
                                                <div className="hover-card">
                                                    <img
                                                        src={u.photoURL || dummy_picture}
                                                        alt={u.name}
                                                    />
                                                    <h4>{u.name}</h4>
                                                    <p><strong>Email:</strong> {u.email}</p>
                                                    <p><strong>Phone:</strong> {u.phone}</p>
                                                    <p><strong>Admin:</strong> {u.admin}</p>
                                                    <p><strong>Created:</strong> {u.createdAt}</p>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
}
