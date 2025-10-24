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


export default function Products() {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [sort, setSort] = useState("Most Relevant");
    const [loading, setLoading] = useState(true);

    const toggleSidebar = () => setIsOpen(!isOpen);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, "products"), orderBy("title"));
                const snapshot = await getDocs(q);

                const productList = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title || "Untitled",
                        subtitle: data.subtitle || "",
                        description: data.description || "",
                        price: data.price || 0,
                        discountPrice: data.discountPrice || null,
                        ribbon: data.ribbon || "",
                        weight: data.weight || "",
                        options: data.options || [],
                        images: data.images || [],
                        createdAt: data.createdAt?.toDate
                            ? data.createdAt.toDate().toLocaleDateString()
                            : "",
                    };
                });

                setProducts(productList);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleDelete = (id) => alert(`Delete product ${id}`);
    const handleEdit = (id) => alert(`Edit product ${id}`);

    // 🔍 Filtering + Sorting
    const filtered = products
        .filter((p) =>
            p.title.toLowerCase().includes(search.toLowerCase().trim())
        )
        .filter((p) => {
            if (filter === "In Stock") return p.ribbon !== "Out of Stock";
            if (filter === "Out of Stock") return p.ribbon === "Out of Stock";
            return true;
        })
        .sort((a, b) => {
            switch (sort) {
                case "Price Lowest First":
                    return a.price - b.price;
                case "Price Highest First":
                    return b.price - a.price;
                case "Ranking Lowest First":
                    return (a.rating || 0) - (b.rating || 0);
                case "Ranking Highest First":
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return 0;
            }
        });

    if (loading) return <div className="loading">Loading products...</div>;

    return (
        <div className="products-container">
            <main className="main-content">
                <Header toggleSidebar={toggleSidebar} />
                <div style={{ display: "flex" }}>
                    <Sidebar barStatus={isOpen ? "active-menu" : "inactive-menu"} />
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <div className="top-bar">
                            <input
                                type="text"
                                placeholder="🔍 Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                                <option>All</option>
                                <option>In Stock</option>
                                <option>Out of Stock</option>
                            </select>
                            <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                <option>Most Relevant</option>
                                <option>Price Lowest First</option>
                                <option>Price Highest First</option>
                                <option>Ranking Lowest First</option>
                                <option>Ranking Highest First</option>
                            </select>
                        </div>

                        <table className="product-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Product</th>
                                    <th>Ribbon</th>
                                    <th>Weight</th>
                                    <th>Options</th>
                                    <th>Created</th>
                                    <th>Status</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (<>
                                    <tr
                                        key={p.id}
                                        onMouseEnter={() => setHovered(p.id)}
                                        onMouseLeave={() => setHovered(null)}
                                    >
                                        <td>{String(i + 1).padStart(2, "0")}</td>
                                        <td>
                                            <div className="product-name-cell">
                                                <img
                                                    src={p.images?.[0] || "/placeholder.png"}
                                                    alt={p.title}
                                                />
                                                <span>{p.title}</span>
                                            </div>
                                        </td>
                                        <td>{p.ribbon}</td>
                                        <td>{p.weight} g</td>
                                        <td>
                                            {p.options
                                                ?.map((opt) => `${opt.name}: ${opt.value}`)
                                                .join(", ") || "-"}
                                        </td>
                                        <td>{p.createdAt}</td>
                                        <td>
                                            <span
                                                className={`status ${p.ribbon === "Out of Stock" ? "out" : "available"
                                                    }`}
                                            >
                                                {p.ribbon === "Out of Stock" ? "Out of Stock" : "Available"}
                                            </span>
                                        </td>
                                        <td>
                                            {p.discountPrice ? (
                                                <>
                                                    <span className="discount">${p.discountPrice}</span>{" "}
                                                    <span className="old">${p.price}</span>
                                                </>
                                            ) : (
                                                `$${p.price}`
                                            )}
                                        </td>
                                        <td className="actions">
                                            <button onClick={() => handleEdit(p.id)}>✏️</button>
                                            <button onClick={() => handleDelete(p.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                    {hovered === p.id && (
                                        <div className="hover-card-cell">
                                            <div className="hover-card">
                                                <img src={p.images?.[0]} alt={p.title} />
                                                <h4>{p.title}</h4>
                                                <p>{p.subtitle}</p>
                                                <p>{p.description || "No description"}</p>
                                                <p>
                                                    <strong>Weight:</strong> {p.weight}g
                                                </p>
                                                <p>
                                                    <strong>Options:</strong>{" "}
                                                    {p.options
                                                        ?.map((opt) => `${opt.name}: ${opt.value}`)
                                                        .join(", ") || "N/A"}
                                                </p>
                                                <p>
                                                    <strong>Created:</strong> {p.createdAt}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
