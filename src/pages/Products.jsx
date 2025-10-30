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
import TopBar from "../components/TopBar";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const navigate = useNavigate();
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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    if (!files.length) return;

    const remainingSlots = 5 - (editingProduct.images?.length || 0);
    const filesToUpload = files.slice(0, remainingSlots);

    await uploadMultipleImages(filesToUpload);

    if (editingProduct.images?.length === 5) {
      let timerInterval;
      Swal.fire({
        title: "Maximum 5",
        html: "You are not allowed to upload more than 5 images.",
        timer: 3000,
        icon: "error",
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const timer = Swal.getPopup().querySelector("b");
          timerInterval = setInterval(() => {
            timer.textContent = `${Swal.getTimerLeft()}`;
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then((result) => {
        /* Read more about handling dismissals below */
        if (result.dismiss === Swal.DismissReason.timer) {
          console.log("I was closed by the timer");
        }
      });
    }
  };


  // ✅ Upload function with proper auth + feedback
  const uploadMultipleImages = async (files) => {
    if (!user) {
      Swal.fire("Unauthorized", "You must be logged in to upload.", "error");
      return;
    }

    // Show one global progress modal
    Swal.fire({
      title: "Uploading images...",
      html: `<div id="upload-progress-text">0%</div>`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: "swal-popup-top" },
    });

    try {
      let completed = 0;
      const total = files.length;
      const uploadedUrls = [];

      // Upload each file sequentially (or you can parallelize if you prefer)
      for (const file of files) {
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snap) => {
              const singleProgress = Math.round(
                (snap.bytesTransferred / snap.totalBytes) * 100
              );
              const overallProgress = Math.round(
                ((completed + singleProgress / 100) / total) * 100
              );
              const el = document.getElementById("upload-progress-text");
              if (el) el.textContent = `${overallProgress}%`;
              setUploadProgress(overallProgress);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls.push(url);
              completed++;
              resolve();
            }
          );
        });
      }

      // Add all new URLs to state together
      setEditingProduct((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));

      setUploadProgress(0);
      Swal.close();
      Swal.fire("✅ Upload Complete", `${uploadedUrls.length} image(s) uploaded successfully.`, "success");
    } catch (error) {
      console.error(error);
      Swal.close();
      Swal.fire("Error", "Some uploads failed.", "error");
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
          <TopBar
            search={search}
            inpchange={(e) => setSearch(e.target.value)}
            filter={filter}
            filchange={(e) => setFilter(e.target.value)}
            sort={sort}
            selchange={(e) => setSort(e.target.value)}
            delete={() => handleDelete(selectedIds)}
            length={selectedIds.length}
            addwidth="20%"
            delwidth="40%"
            data={selectedIds.length}
            add={() => navigate("/products-add")}
            page="products"
          />

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
            className="glass-form"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2>Product Editor</h2>
              <p>Update your product details below</p>
            </div>
            <div className="edit-modal-grid">
              {/* Title */}
              <div className="left-col">
                <div className="input-tooltip">
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
                  </div>
                  {toolTip === "Title" && (
                    <small>Enter title here</small>
                  )}
                </div>
                {/* Subtitle */}
                <div className="input-tooltip">
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
                  </div>
                  {toolTip === "Subtitle" && (
                    <small>Enter subtitle here</small>
                  )}
                </div>
                {/* Description */}
                <div className="input-tooltip" style={{ height: '140px' }}>
                  <div className="input-group" onMouseEnter={() => setToolTip("Description")} onMouseLeave={() => setToolTip(null)}>
                    <i className="fa-solid fa-align-left"></i>
                    <textarea
                      rows={7}
                      style={{ resize: 'none' }}
                      placeholder="Description"
                      value={editingProduct.description}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  {toolTip === "Description" && (
                    <small>Enter description here</small>
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
                  <p>You can upload maximum of 5 files only..</p>
                  <input type="file" accept="image/*" multiple onChange={handleFileSelect} hidden />
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
              <div className="right-col">
                {/* Price & Discount */}
                <div className="input-tooltip">
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
                  </div>
                  {toolTip === "Actual Price" && (
                    <small>Enter actual price here</small>
                  )}
                </div>
                <div className="input-tooltip">
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
                  </div>
                  {toolTip === "Discounted Price" && (
                    <small>Enter discounted price here</small>
                  )}
                </div>
                {/* Ribbon */}
                <div className="input-tooltip">
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
                  </div>
                  {toolTip === "Ribbon" && (
                    <small>Enter Ribbon here. If product is not in stock please write Out of Stock.</small>
                  )}
                </div>
                {/* Weight */}
                <div className="input-tooltip" style={{ marginBottom: 30 }}>
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
                  </div>
                  {toolTip === "Weight" && (
                    <small>Enter product weight here in gms.</small>
                  )}
                </div>
              </div>
            </div>

            <div className="edit-actions">
              <button className="save-btn-edit" onClick={handleEditSave}>
                💾 Save Changes
              </button>
              <button className="cancel-btn-edit" onClick={() => setEditingProduct(null)}>
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
