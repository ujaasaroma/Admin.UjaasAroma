import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import Swal from 'sweetalert2';

// Async thunk for updating order status
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      await updateDoc(doc(db, 'successOrders', orderId), {
        status: status,
        'shipping.status': status,
      });
      return { orderId, status };
    } catch (error) {
      console.error('Error updating order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting orders
export const deleteOrders = createAsyncThunk(
  'orders/deleteOrders',
  async (orderIds, { rejectWithValue }) => {
    try {
      for (const id of orderIds) {
        await deleteDoc(doc(db, 'successOrders', id));
      }
      return orderIds;
    } catch (error) {
      console.error('Error deleting orders:', error);
      return rejectWithValue(error.message);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    allOrders: [],
    loading: true,
    error: null,
    selectedOrderIds: [],
    selectAll: false,
    selectedOrder: null, // For viewing order details
  },
  reducers: {
    setOrders: (state, action) => {
      state.allOrders = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    toggleSelectOrder: (state, action) => {
      const id = action.payload;
      if (state.selectedOrderIds.includes(id)) {
        state.selectedOrderIds = state.selectedOrderIds.filter((x) => x !== id);
      } else {
        state.selectedOrderIds.push(id);
      }
    },
    toggleSelectAllOrders: (state, action) => {
      const orderIds = action.payload;
      if (state.selectAll) {
        state.selectedOrderIds = [];
      } else {
        state.selectedOrderIds = orderIds;
      }
      state.selectAll = !state.selectAll;
    },
    clearSelectedOrders: (state) => {
      state.selectedOrderIds = [];
      state.selectAll = false;
    },
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { orderId, status } = action.payload;
        const orderIndex = state.allOrders.findIndex((o) => o.id === orderId);
        if (orderIndex !== -1) {
          state.allOrders[orderIndex].status = status;
          if (state.allOrders[orderIndex].shipping) {
            state.allOrders[orderIndex].shipping.status = status;
          }
        }
        Swal.fire('Success!', 'Order status updated.', 'success');
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        Swal.fire('Error', action.payload, 'error');
      })
      // Delete Orders
      .addCase(deleteOrders.fulfilled, (state, action) => {
        state.allOrders = state.allOrders.filter(
          (o) => !action.payload.includes(o.id)
        );
        state.selectedOrderIds = [];
        state.selectAll = false;
        Swal.fire('Deleted!', 'Selected orders were deleted.', 'success');
      })
      .addCase(deleteOrders.rejected, (state, action) => {
        Swal.fire('Error', action.payload, 'error');
      });
  },
});

export const {
  setOrders,
  setLoading,
  toggleSelectOrder,
  toggleSelectAllOrders,
  clearSelectedOrders,
  setSelectedOrder,
  clearError,
} = ordersSlice.actions;

export default ordersSlice.reducer;
