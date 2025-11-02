import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import Swal from 'sweetalert2';

// Async thunk for adding a product
export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData, { rejectWithValue }) => {
    try {
      // Validation
      if (!productData.title.trim()) {
        throw new Error('Product title is required.');
      }
      if (!productData.price || productData.price <= 0) {
        throw new Error('Valid price is required.');
      }
      if (productData.images.length === 0) {
        throw new Error('At least one image is required.');
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, ...productData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating a product
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { id, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting products
export const deleteProducts = createAsyncThunk(
  'products/deleteProducts',
  async (ids, { rejectWithValue }) => {
    try {
      for (const id of ids) {
        await updateDoc(doc(db, 'products', id), { deleted: 1 });
      }
      return ids;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for uploading images
export const uploadImages = createAsyncThunk(
  'products/uploadImages',
  async ({ files, user }, { rejectWithValue, dispatch }) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to upload.');
      }

      const uploadedUrls = [];
      const total = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const url = await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snap) => {
              const singleProgress = Math.round(
                (snap.bytesTransferred / snap.totalBytes) * 100
              );
              const overallProgress = Math.round(
                ((i + singleProgress / 100) / total) * 100
              );
              dispatch(setUploadProgress(overallProgress));

              // Update the progress text in Swal if element exists
              const el = document.getElementById('upload-progress-text');
              if (el) el.textContent = `${overallProgress}%`;
            },
            (error) => reject(error),
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            }
          );
        });

        uploadedUrls.push(url);
      }

      dispatch(setUploadProgress(0));
      return uploadedUrls;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting an image
export const deleteImage = createAsyncThunk(
  'products/deleteImage',
  async (url, { rejectWithValue }) => {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
      return url;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    loading: true,
    error: null,
    search: '',
    filter: 'All',
    sort: 'Most Relevant',
    selectedIds: [],
    selectAll: false,
    editingProduct: null,
    addingProduct: null,
    hovered: null,
    toolTip: null,
    uploadProgress: 0,
    draggingIndex: null,
  },
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    toggleSelect: (state, action) => {
      const id = action.payload;
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((x) => x !== id);
      } else {
        state.selectedIds.push(id);
      }
    },
    toggleSelectAll: (state, action) => {
      const filteredIds = action.payload;
      if (state.selectAll) {
        state.selectedIds = [];
      } else {
        state.selectedIds = filteredIds;
      }
      state.selectAll = !state.selectAll;
    },
    clearSelectedIds: (state) => {
      state.selectedIds = [];
      state.selectAll = false;
    },
    setEditingProduct: (state, action) => {
      state.editingProduct = action.payload;
    },
    setAddingProduct: (state, action) => {
      state.addingProduct = action.payload;
    },
    updateEditingProduct: (state, action) => {
      state.editingProduct = { ...state.editingProduct, ...action.payload };
    },
    updateAddingProduct: (state, action) => {
      state.addingProduct = { ...state.addingProduct, ...action.payload };
    },
    setHovered: (state, action) => {
      state.hovered = action.payload;
    },
    setToolTip: (state, action) => {
      state.toolTip = action.payload;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setDraggingIndex: (state, action) => {
      state.draggingIndex = action.payload;
    },
    reorderImages: (state, action) => {
      const { fromIndex, toIndex, isEditing } = action.payload;
      const product = isEditing ? state.editingProduct : state.addingProduct;

      if (!product || !Array.isArray(product.images)) return;

      const newImages = [...product.images];
      const [dragged] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, dragged);

      if (isEditing) {
        state.editingProduct.images = newImages;
      } else {
        state.addingProduct.images = newImages;
      }
    },
    addImagesToProduct: (state, action) => {
      const { urls, isEditing } = action.payload;
      if (isEditing) {
        state.editingProduct.images = [
          ...(state.editingProduct.images || []),
          ...urls,
        ];
      } else {
        state.addingProduct.images = [
          ...(state.addingProduct.images || []),
          ...urls,
        ];
      }
    },
    removeImageFromProduct: (state, action) => {
      const { url, isEditing } = action.payload;
      if (isEditing) {
        state.editingProduct.images = state.editingProduct.images.filter(
          (i) => i !== url
        );
      } else {
        state.addingProduct.images = state.addingProduct.images.filter(
          (i) => i !== url
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Product
      .addCase(addProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.addingProduct = null;
        Swal.fire('Success!', 'Product added successfully.', 'success');
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.loading = false;
        Swal.fire('Error', action.payload, 'error');
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.editingProduct = null;
        Swal.fire('Updated!', 'Product saved successfully.', 'success');
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        Swal.fire('Error', action.payload, 'error');
      })
      // Delete Products
      .addCase(deleteProducts.fulfilled, (state, action) => {
        state.selectedIds = [];
        state.selectAll = false;
        Swal.fire(
          'Deleted!',
          'Products has been deleted successfully..',
          'success'
        );
      })
      .addCase(deleteProducts.rejected, (state, action) => {
        Swal.fire('Error', action.payload, 'error');
      })
      // Upload Images
      .addCase(uploadImages.fulfilled, (state, action) => {
        Swal.fire(
          '✅ Upload Complete',
          `${action.payload.length} image(s) uploaded successfully.`,
          'success'
        );
      })
      .addCase(uploadImages.rejected, (state, action) => {
        Swal.fire('Error', action.payload || 'Some uploads failed.', 'error');
      })
      // Delete Image
      .addCase(deleteImage.fulfilled, (state, action) => {
        Swal.fire('Deleted!', 'Image removed.', 'success');
      })
      .addCase(deleteImage.rejected, (state, action) => {
        Swal.fire('Error', 'Could not delete image.', 'error');
      });
  },
});

export const {
  setProducts,
  setLoading,
  setSearch,
  setFilter,
  setSort,
  toggleSelect,
  toggleSelectAll,
  clearSelectedIds,
  setEditingProduct,
  setAddingProduct,
  updateEditingProduct,
  updateAddingProduct,
  setHovered,
  setToolTip,
  setUploadProgress,
  setDraggingIndex,
  reorderImages,
  addImagesToProduct,
  removeImageFromProduct,
} = productsSlice.actions;

export default productsSlice.reducer;
