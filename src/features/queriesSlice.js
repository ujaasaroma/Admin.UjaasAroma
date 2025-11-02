import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import Swal from 'sweetalert2';

// Async thunk for deleting queries (marking as deleted)
export const deleteQueries = createAsyncThunk(
  'queries/deleteQueries',
  async (ids, { rejectWithValue }) => {
    try {
      for (const id of ids) {
        await updateDoc(doc(db, 'mobileAppContactFormQueries', id), {
          deleted: 1,
        });
      }
      return ids;
    } catch (error) {
      console.error('Error deleting queries:', error);
      return rejectWithValue(error.message);
    }
  }
);

const queriesSlice = createSlice({
  name: 'queries',
  initialState: {
    queries: [],
    loading: true,
    error: null,
    search: '',
    sort: 'Most Recent',
    selectedIds: [],
    selectAll: false,
    selectedQuery: null,
  },
  reducers: {
    setQueries: (state, action) => {
      state.queries = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
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
    setSelectedQuery: (state, action) => {
      state.selectedQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Delete Queries
      .addCase(deleteQueries.fulfilled, (state, action) => {
        state.queries = state.queries.filter(
          (q) => !action.payload.includes(q.id)
        );
        state.selectedIds = [];
        state.selectAll = false;
        Swal.fire('Deleted!', 'Selected queries were deleted.', 'success');
      })
      .addCase(deleteQueries.rejected, (state, action) => {
        Swal.fire('Error', 'Failed to delete queries.', 'error');
      });
  },
});

export const {
  setQueries,
  setLoading,
  setSearch,
  setSort,
  toggleSelect,
  toggleSelectAll,
  clearSelectedIds,
  setSelectedQuery,
  clearError,
} = queriesSlice.actions;

export default queriesSlice.reducer;
