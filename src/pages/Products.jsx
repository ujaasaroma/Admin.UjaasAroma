import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage, auth } from "../config/firebase"; // ✅ make sure these are from same app
import "./styles/Products.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProductSkeleton from "../components/ProductSkeleton";
import { useSidebar } from "../context/SidebarContext";
import Swal from "sweetalert2";
import Edit from "../assets/icons/edit.png";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Products() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [toolTip, setToolTip] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Most Relevant");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [user, setUser] = useState(null); // ✅ Track signed-in user
  const dropRef = useRef();
  const { collapsed } = useSidebar();



  // ✅ Sync Firebase Auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // 🔥 Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("title"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          images: data.images || [],
          deleted: data.deleted || 0,
          updatedAt: data.updatedAt?.toDate
            ? (() => {
              const d = data.updatedAt.toDate();
              return d.toLocaleString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
            })()
            : "",
        };
      });
      setProducts(list.filter((p) => p.deleted !== 1));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Checkbox logic
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    if (selectAll) setSelectedIds([]);
    else setSelectedIds(filtered.map((p) => p.id));
    setSelectAll(!selectAll);
  };

  // 🗑️ Delete
  const handleDelete = async (ids) => {
    if (!ids.length) return;
    const result = await Swal.fire({
      title:
        ids.length > 1
          ? `Delete ${ids.length} selected products?`
          : "Delete this product?",
      text: "This will mark them as deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
      customClass: { popup: "swal-popup-top" },
    });
    if (result.isConfirmed) {
      for (const id of ids) await updateDoc(doc(db, "products", id), { deleted: 1 });
      Swal.fire("Deleted!", "Products marked as deleted.", "success");
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  // ✏️ Edit modal open
  const handleEdit = (product) =>
    setEditingProduct({ ...product, images: product.images || [] });

  const handleEditSave = async () => {
    try {
      await updateDoc(doc(db, "products", editingProduct.id), {
        ...editingProduct,
        updatedAt: serverTimestamp(),
      });

      Swal.fire("Updated!", "Product saved successfully.", "success");
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      Swal.fire("Error", "Failed to save product.", "error");
    }
  };

  // 📁 File upload
  const openFilePicker = () => {
    if (dropRef.current) {
      const input = dropRef.current.querySelector("input[type='file']");
      if (input) input.click();
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadImage(file);
  };

  // ✅ Upload function with proper auth + feedback
  const uploadImage = async (file) => {
    try {
      if (!user) {
        Swal.fire("Unauthorized", "You must be logged in to upload.", "error");
        return;
      }

      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      Swal.fire({
        title: "Uploading...",
        html: `<div id="upload-progress-text">0%</div>`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        customClass: { popup: "swal-popup-top" },
      });

      uploadTask.on(
        "state_changed",
        (snap) => {
          const progress = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100
          );
          const el = document.getElementById("upload-progress-text");
          if (el) el.textContent = progress + "%";
          setUploadProgress(progress);
        },
        (error) => {
          Swal.close();
          if (error.code === "storage/unauthorized") {
            Swal.fire(
              "Permission Denied",
              "Your account is not authorized to upload product images.",
              "error"
            );
          } else {
            Swal.fire("Error", "Upload failed.", "error");
          }
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setEditingProduct((prev) => ({
            ...prev,
            images: [...(prev.images || []), url],
          }));
          setUploadProgress(0);
          Swal.close();
          Swal.fire("Success", "Image uploaded!", "success");
        }
      );
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Upload failed.", "error");
    }
  };

  const handleImageDelete = async (url) => {
    const result = await Swal.fire({
      title: "Delete this image?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      customClass: { popup: "swal-popup-top" },
    });
    if (!result.isConfirmed) return;
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
      setEditingProduct((prev) => ({
        ...prev,
        images: prev.images.filter((i) => i !== url),
      }));
      Swal.fire("Deleted!", "Image removed.", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not delete image.", "error");
    }
  };

  // 🖱️ Image reordering
  const handleDragStart = (index) => setDraggingIndex(index);
  const handleDragEnter = (index) => {
    if (!editingProduct || !Array.isArray(editingProduct.images)) return;
    if (index === draggingIndex || draggingIndex === null) return;

    setEditingProduct((prev) => {
      if (!prev?.images) return prev;
      const newImages = [...prev.images];
      const [dragged] = newImages.splice(draggingIndex, 1);
      newImages.splice(index, 0, dragged);
      return { ...prev, images: newImages };
    });

    setDraggingIndex(index);
  };
  const handleDragEnd = () => setDraggingIndex(null);

  // 🔍 Filter + Sort
  const filtered = products
    .filter((p) =>
      [p.title, p.ribbon, p.createdAt]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    )
    .filter((p) =>
      filter === "In Stock"
        ? p.ribbon !== "Out of Stock"
        : filter === "Out of Stock"
          ? p.ribbon === "Out of Stock"
          : true
    )
    .sort((a, b) =>
      sort === "Price Lowest First"
        ? a.price - b.price
        : sort === "Price Highest First"
          ? b.price - a.price
          : 0
    );

  if (loading)
    return (
      <div className="loading-shimmer">
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <ProductSkeleton />
          </div>
        ))}
      </div>
    );

  return (
    <div className="products-container">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar
        barStatus={isOpen ? "active-menu" : "inactive-menu"}
        products="active"
      />
      <section className={`mainsection ${collapsed ? "collapsed" : ""}`}>
        <div className="tables-section">
          <div className="top-bar">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="filter-sort">
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option>All</option>
                <option>In Stock</option>
                <option>Out of Stock</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Most Relevant</option>
                <option>Price Lowest First</option>
                <option>Price Highest First</option>
              </select>
              {selectedIds.length > 0 && (
                <button
                  className="delete-selected-btn"
                  onClick={() => handleDelete(selectedIds)}
                >
                  <i className="fa-solid fa-trash"></i> Delete ({selectedIds.length})
                </button>
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
                <th>Product</th>
                <th>Ribbon</th>
                <th>Weight</th>
                <th>Last Updated</th>
                <th>Status</th>
                <th>Price</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <React.Fragment key={p.id}>
                  <tr
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td>
                      <div className="product-name-cell">
                        <img src={p.images?.[0]} alt={p.title} />
                        <span>{p.title}</span>
                      </div>
                    </td>
                    <td>{p.ribbon}</td>
                    <td>{p.weight}g</td>
                    <td>{p.updatedAt}</td>
                    <td>
                      <span
                        className={`status ${p.ribbon === "Out of Stock" ? "out" : "available"
                          }`}
                      >
                        {p.ribbon === "Out of Stock"
                          ? "Out of Stock"
                          : "Available"}
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
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleEdit(p)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <img src={Edit} alt="✏️" style={{ width: 30 }} />
                      </button>
                    </td>
                  </tr>

                  {hovered === p.id && (
                    <div className="hover-card-cell">
                      <div className="hover-card">
                        <img src={p.images?.[0]} alt={p.title} />
                        <h4>{p.title}</h4>
                        <p>{p.subtitle}</p>
                        <p>{p.description || "No description"}</p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Footer />

      {/* ✏️ Modal (Glassy Registration-Style) */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div
            className="edit-modal-container glass-form"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Product Editor</h2>
            <p>Update your product details below</p>

            <div className="edit-modal-grid">
              {/* Title */}
              <div className="two-col">
                <div className="input-group" onMouseEnter={() => setToolTip("Title")} onMouseLeave={() => setToolTip(null)}>
                  <i className="fa-solid fa-box"></i>
                  <input
                    type="text"
                    placeholder="Product Title"
                    value={editingProduct.title}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, title: e.target.value })
                    }
                  />
                  {toolTip === "Title" && (
                    <small className="input-tootip">Enter title here</small>
                  )}
                </div>

                {/* Subtitle */}
                <div className="input-group" onMouseEnter={() => setToolTip("Subtitle")} onMouseLeave={() => setToolTip(null)}>
                  <i className="fa-solid fa-pen-to-square"></i>
                  <input
                    type="text"
                    placeholder="Subtitle"
                    value={editingProduct.subtitle}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, subtitle: e.target.value })
                    }
                  />
                   {toolTip === "Subtitle" && (
                    <small className="input-tootip">Enter subtitle here</small>
                  )}
                </div>
              </div>
              {/* Description */}
              <div className="input-group" onMouseEnter={() => setToolTip("Description")} onMouseLeave={() => setToolTip(null)}>
                <i className="fa-solid fa-align-left"></i>
                <textarea
                  placeholder="Description"
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                />
                {toolTip === "Description" && (
                    <small className="input-tootip" style={{top:80}}>Enter description here</small>
                  )}
              </div>

              {/* Price & Discount */}
              <div className="two-col">
                <div className="input-group" onMouseEnter={() => setToolTip("Actual Price")} onMouseLeave={() => setToolTip(null)}>
                  <i className="fa-solid fa-dollar-sign"></i>
                  <input
                    type="number"
                    placeholder="Price"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number(e.target.value),
                      })
                    }
                  />
                  {toolTip === "Actual Price" && (
                    <small className="input-tootip">Enter actual price here</small>
                  )}
                </div>
                <div className="input-group" onMouseEnter={() => setToolTip("Discounted Price")} onMouseLeave={() => setToolTip(null)}>
                  <i className="fa-solid fa-dollar-sign"></i>
                  <input
                    type="number"
                    placeholder="Discount Price"
                    value={editingProduct.discountPrice || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: Number(e.target.value),
                      })
                    }
                  />
                  {toolTip === "Discounted Price" && (
                    <small className="input-tootip">Enter discounted price here</small>
                  )}
                </div>
              </div>

              {/* Ribbon */}
              <div className="input-group" onMouseEnter={() => setToolTip("Ribbon")} onMouseLeave={() => setToolTip(null)}>
                <i className="fa-solid fa-ribbon"></i>
                <input
                  type="text"
                  placeholder="Ribbon (e.g. New, Sale)"
                  value={editingProduct.ribbon}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, ribbon: e.target.value })
                  }
                />
                {toolTip === "Ribbon" && (
                    <small className="input-tootip">Enter Ribbon here. If product is not in stock please write Out of Stock.</small>
                  )}
              </div>

              {/* Weight */}
              <div className="input-group" onMouseEnter={() => setToolTip("Weight")} onMouseLeave={() => setToolTip(null)}>
                <i className="fa-solid fa-weight-hanging"></i>
                <input
                  type="text"
                  placeholder="Weight (g)"
                  value={editingProduct.weight}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, weight: e.target.value })
                  }
                />
                {toolTip === "Weight" && (
                    <small className="input-tootip">Enter product weight here in gms.</small>
                  )}
              </div>

              {/* Drop Zone */}
              <div
                className="drop-zone"
                ref={dropRef}
                onClick={openFilePicker}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
              >
                <p>📁 Drag & drop product images or click to upload</p>
                <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
                {uploadProgress > 0 && (
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              {/* Image Grid with Drag */}
              <div className="image-preview-grid">
                {editingProduct.images?.map((img, i) => (
                  <div
                    key={i}
                    className="preview-item"
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragEnter={() => handleDragEnter(i)}
                    onDragEnd={handleDragEnd}
                  >
                    <img src={img} alt={`img-${i}`} />
                    <button onClick={() => handleImageDelete(img)}>✖</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="edit-actions">
              <button className="save-btn" onClick={handleEditSave}>
                💾 Save Changes
              </button>
              <button className="cancel-btn" onClick={() => setEditingProduct(null)}>
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
