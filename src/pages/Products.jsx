import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import "./styles/Products.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ProductSkeleton from "../components/ProductSkeleton";
import { useSidebar } from "../context/SidebarContext";
import Swal from "sweetalert2";
import Edit from "../assets/icons/edit.png";
import { onAuthStateChanged } from "firebase/auth";
import TopBar from "../components/TopBar";
import { useNavigate } from "react-router-dom";
import {
  setProducts,
  setSearch,
  setFilter,
  setSort,
  toggleSelect,
  toggleSelectAll,
  setEditingProduct,
  setAddingProduct,
  updateEditingProduct,
  updateAddingProduct,
  setHovered,
  setToolTip,
  setDraggingIndex,
  reorderImages,
  addImagesToProduct,
  removeImageFromProduct,
  addProduct,
  updateProduct,
  deleteProducts,
  uploadImages,
  deleteImage,
} from "../features/productsSlice";
import { loginSuccess, logout } from "../features/authSlice";
import { toggleSidebar as toggleSidebarAction } from "../features/uiSlice";

export default function Products() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropRef = useRef();
  const { collapsed } = useSidebar();

  // Redux state
  const {
    products,
    loading,
    search,
    filter,
    sort,
    selectedIds,
    selectAll,
    editingProduct,
    addingProduct,
    hovered,
    toolTip,
    uploadProgress,
    draggingIndex,
  } = useSelector((state) => state.products);

  const { user, isLoggedIn } = useSelector((state) => state.auth);
  const { isOpen } = useSelector((state) => state.ui);

  // ✅ Sync Firebase Auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        // User is signed in
        dispatch(
          loginSuccess({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          })
        );
      } else {
        // User is signed out
        dispatch(logout());
      }
    });
    return () => unsub();
  }, [dispatch]);

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
      dispatch(setProducts(list.filter((p) => p.deleted !== 1)));
    });
    return () => unsubscribe();
  }, [dispatch]);

  // 🗑️ Delete
  const handleDelete = async (ids) => {
    if (!ids.length) return;
    const result = await Swal.fire({
      title:
        ids.length > 1
          ? `Delete ${ids.length} selected products?`
          : "Delete this product?",
      text: "This action can't be undone.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
      customClass: { popup: "swal-popup-top" },
    });
    if (result.isConfirmed) {
      dispatch(deleteProducts(ids));
    }
  };

  // ✏️ Edit modal open
  const handleEdit = (product) =>
    dispatch(setEditingProduct({ ...product, images: product.images || [] }));

  const handleAddNew = () => {
    dispatch(
      setAddingProduct({
        title: "",
        subtitle: "",
        description: "",
        price: 0,
        discountPrice: 0,
        ribbon: "",
        weight: "",
        images: [],
        deleted: 0,
      })
    );
  };

  const handleEditSave = async () => {
    dispatch(updateProduct({ id: editingProduct.id, data: editingProduct }));
  };

  const handleAddSave = async () => {
    dispatch(addProduct(addingProduct));
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
    const files = Array.from(e.dataTransfer.files).slice(0, 5);
    if (files.length) handleFileSelect({ target: { files } });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    if (!files.length) return;

    const currentProduct = editingProduct || addingProduct;
    const remainingSlots = 5 - (currentProduct?.images?.length || 0);
    const filesToUpload = files.slice(0, remainingSlots);

    // Show progress modal
    Swal.fire({
      title: "Uploading images...",
      html: `<div id="upload-progress-text">0%</div>`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: "swal-popup-top" },
    });

    const result = await dispatch(uploadImages({ files: filesToUpload, user }));

    if (result.payload) {
      dispatch(
        addImagesToProduct({
          urls: result.payload,
          isEditing: !!editingProduct,
        })
      );
    }

    Swal.close();

    if (currentProduct?.images?.length >= 5) {
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
        },
      });
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

    await dispatch(deleteImage(url));
    dispatch(
      removeImageFromProduct({
        url,
        isEditing: !!editingProduct,
      })
    );
  };

  // 🖱️ Image reordering
  const handleDragStart = (index) => dispatch(setDraggingIndex(index));

  const handleDragEnter = (index) => {
    if (!editingProduct && !addingProduct) return;
    if (index === draggingIndex || draggingIndex === null) return;

    dispatch(
      reorderImages({
        fromIndex: draggingIndex,
        toIndex: index,
        isEditing: !!editingProduct,
      })
    );

    dispatch(setDraggingIndex(index));
  };

  const handleDragEnd = () => dispatch(setDraggingIndex(null));

  // 🔍 Filter + Sort
  // 🔍 Filter + Sort
  const filtered = products
    .filter((p) => {
      try {
        // ✅ Safely handle undefined/null values
        const title = (p?.title || "").toString();
        const ribbon = (p?.ribbon || "").toString();
        const createdAt = (p?.createdAt || "").toString();
        const searchText = [title, ribbon, createdAt].join(" ").toLowerCase();
        return searchText.includes((search || "").toLowerCase().trim());
      } catch (error) {
        console.error("Filter error for product:", p, error);
        return false;
      }
    })
    .filter((p) => {
      if (filter === "In Stock") {
        return p?.ribbon !== "Out of Stock";
      } else if (filter === "Out of Stock") {
        return p?.ribbon === "Out of Stock";
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = Number(a?.price) || 0;
      const priceB = Number(b?.price) || 0;

      if (sort === "Price Lowest First") {
        return priceA - priceB;
      } else if (sort === "Price Highest First") {
        return priceB - priceA;
      }
      return 0;
    });


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
      <Header toggleSidebar={() => dispatch(toggleSidebarAction())} />
      <Sidebar
        barStatus={isOpen ? "active-menu" : "inactive-menu"}
        products="active"
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
            delete={() => handleDelete(selectedIds)}
            length={selectedIds.length}
            addwidth="20%"
            delwidth="40%"
            data={selectedIds.length}
            add={handleAddNew}
            page="products"
            searchBy="🔍 Search by title, ribbon..."
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
                        dispatch(toggleSelectAll(filtered.map((p) => p.id)))
                      }
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-orders">
                      No matching product found..
                    </td>
                  </tr>
                ) : (<>
                  {
                    filtered.map((p) => (
                      <React.Fragment key={p.id}>
                        <tr
                          onMouseEnter={() => dispatch(setHovered(p.id))}
                          onMouseLeave={() => dispatch(setHovered(null))}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => dispatch(toggleSelect(p.id))}
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
                    ))
                  }
                </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Footer />

      {/* ✏️ Edit Modal */}
      {editingProduct && (
        <div
          className="modal-overlay"
          onClick={() => dispatch(setEditingProduct(null))}
        >
          <div className="glass-form" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2>Product Editor</h2>
              <p>Update your product details below</p>
            </div>
            <div className="edit-modal-grid">
              <div className="left-col">
                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Title"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-box"></i>
                    <input
                      type="text"
                      placeholder="Product Title"
                      value={editingProduct.title}
                      onChange={(e) =>
                        dispatch(updateEditingProduct({ title: e.target.value }))
                      }
                    />
                  </div>
                  {toolTip === "Title" && <small>Enter title here</small>}
                </div>

                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Subtitle"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={editingProduct.subtitle}
                      onChange={(e) =>
                        dispatch(
                          updateEditingProduct({ subtitle: e.target.value })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Subtitle" && <small>Enter subtitle here</small>}
                </div>

                <div className="input-tooltip" style={{ height: "140px" }}>
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Description"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-align-left"></i>
                    <textarea
                      rows={7}
                      style={{ resize: "none" }}
                      placeholder="Description"
                      value={editingProduct.description}
                      onChange={(e) =>
                        dispatch(
                          updateEditingProduct({ description: e.target.value })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Description" && (
                    <small>Enter description here</small>
                  )}
                </div>

                <div
                  className="drop-zone"
                  ref={dropRef}
                  onClick={openFilePicker}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <p>📁 Drag & drop product images or click to upload</p>
                  <p>You can upload maximum of 5 files only..</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    hidden
                  />
                  {uploadProgress > 0 && (
                    <div className="progress-bar">
                      <div
                        className="progress"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

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
                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Actual Price"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-dollar-sign"></i>
                    <input
                      type="number"
                      placeholder="Price"
                      value={editingProduct.price}
                      onChange={(e) =>
                        dispatch(
                          updateEditingProduct({ price: Number(e.target.value) })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Actual Price" && (
                    <small>Enter actual price here</small>
                  )}
                </div>

                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Discounted Price"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-dollar-sign"></i>
                    <input
                      type="number"
                      placeholder="Discount Price"
                      value={editingProduct.discountPrice || ""}
                      onChange={(e) =>
                        dispatch(
                          updateEditingProduct({
                            discountPrice: Number(e.target.value),
                          })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Discounted Price" && (
                    <small>Enter discounted price here</small>
                  )}
                </div>

                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Ribbon"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-ribbon"></i>
                    <input
                      type="text"
                      placeholder="Ribbon (e.g. New, Sale)"
                      value={editingProduct.ribbon}
                      onChange={(e) =>
                        dispatch(updateEditingProduct({ ribbon: e.target.value }))
                      }
                    />
                  </div>
                  {toolTip === "Ribbon" && (
                    <small style={{ paddingTop: 10 }}>
                      Enter Ribbon here. If product is not in stock please write
                      Out of Stock.
                    </small>
                  )}
                </div>

                <div className="input-tooltip" style={{ marginTop: 20 }}>
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Weight"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-weight-hanging"></i>
                    <input
                      type="text"
                      placeholder="Weight (g)"
                      value={editingProduct.weight}
                      onChange={(e) =>
                        dispatch(updateEditingProduct({ weight: e.target.value }))
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
              <button
                className="cancel-btn-edit"
                onClick={() => dispatch(setEditingProduct(null))}
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ Add New Product Modal */}
      {addingProduct && (
        <div
          className="modal-overlay"
          onClick={() => dispatch(setAddingProduct(null))}
        >
          <div className="glass-form" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2>Add New Product</h2>
              <p>Enter product details below</p>
            </div>
            <div className="edit-modal-grid">
              <div className="left-col">
                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Title"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-box"></i>
                    <input
                      type="text"
                      placeholder="Product Title"
                      value={addingProduct.title}
                      onChange={(e) =>
                        dispatch(updateAddingProduct({ title: e.target.value }))
                      }
                    />
                  </div>
                  {toolTip === "Title" && <small>Enter title here</small>}
                </div>

                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Subtitle"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={addingProduct.subtitle}
                      onChange={(e) =>
                        dispatch(
                          updateAddingProduct({ subtitle: e.target.value })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Subtitle" && <small>Enter subtitle here</small>}
                </div>

                <div className="input-tooltip" style={{ height: "140px" }}>
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Description"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-align-left"></i>
                    <textarea
                      rows={7}
                      style={{ resize: "none" }}
                      placeholder="Description"
                      value={addingProduct.description}
                      onChange={(e) =>
                        dispatch(
                          updateAddingProduct({ description: e.target.value })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Description" && (
                    <small>Enter description here</small>
                  )}
                </div>

                <div
                  className="drop-zone"
                  ref={dropRef}
                  onClick={openFilePicker}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <p>📁 Drag & drop product images or click to upload</p>
                  <p>You can upload maximum of 5 files only..</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    hidden
                  />
                  {uploadProgress > 0 && (
                    <div className="progress-bar">
                      <div
                        className="progress"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="image-preview-grid">
                  {addingProduct.images?.map((img, i) => (
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
                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Actual Price"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-dollar-sign"></i>
                    <input
                      type="number"
                      placeholder="Price"
                      value={addingProduct.price}
                      onChange={(e) =>
                        dispatch(
                          updateAddingProduct({ price: Number(e.target.value) })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Actual Price" && (
                    <small>Enter actual price here</small>
                  )}
                </div>

                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Discounted Price"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-dollar-sign"></i>
                    <input
                      type="number"
                      placeholder="Discount Price"
                      value={addingProduct.discountPrice || ""}
                      onChange={(e) =>
                        dispatch(
                          updateAddingProduct({
                            discountPrice: Number(e.target.value),
                          })
                        )
                      }
                    />
                  </div>
                  {toolTip === "Discounted Price" && (
                    <small>Enter discounted price here</small>
                  )}
                </div>

                <div className="input-tooltip">
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Ribbon"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-ribbon"></i>
                    <input
                      type="text"
                      placeholder="Ribbon (e.g. New, Sale)"
                      value={addingProduct.ribbon}
                      onChange={(e) =>
                        dispatch(updateAddingProduct({ ribbon: e.target.value }))
                      }
                    />
                  </div>
                  {toolTip === "Ribbon" && (
                    <small style={{ paddingTop: 10 }}>
                      Enter Ribbon here. If product is not in stock please write
                      Out of Stock.
                    </small>
                  )}
                </div>

                <div className="input-tooltip" style={{ marginTop: 20 }}>
                  <div
                    className="input-group"
                    onMouseEnter={() => dispatch(setToolTip("Weight"))}
                    onMouseLeave={() => dispatch(setToolTip(null))}
                  >
                    <i className="fa-solid fa-weight-hanging"></i>
                    <input
                      type="text"
                      placeholder="Weight (g)"
                      value={addingProduct.weight}
                      onChange={(e) =>
                        dispatch(updateAddingProduct({ weight: e.target.value }))
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
              <button className="save-btn-edit" onClick={handleAddSave}>
                ➕ Add Product
              </button>
              <button
                className="cancel-btn-edit"
                onClick={() => dispatch(setAddingProduct(null))}
              >
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
