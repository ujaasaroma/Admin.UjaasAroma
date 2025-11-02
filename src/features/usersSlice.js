import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import Swal from 'sweetalert2';

// Async thunk for fetching users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const q = query(collection(db, 'users'), orderBy('name'));
      const snapshot = await getDocs(q);

      const userList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed User',
          email: data.email || 'N/A',
          phone: data.phone || '-',
          admin: data.admin === 1 || data.admin === true ? 'Yes' : 'No',
          emailVerified: data.emailVerified ? 'Verified' : 'Not Verified',
          photoURL: data.photoURL || null,
          createdAt: data.createdAt?.toDate
            ? (() => {
                const d = data.createdAt.toDate();
                return d.toLocaleString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
              })()
            : '',
          updatedAt: data.updatedAt?.toDate
            ? (() => {
                const d = data.updatedAt.toDate();
                return d.toLocaleString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
              })()
            : '',
        };
      });

      return userList;
    } catch (error) {
      console.error('Error fetching users:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating a user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await updateDoc(doc(db, 'users', id), data);
      return { id, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a user
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: true,
    error: null,
    search: '',
    filter: 'All',
    sort: 'Most Relevant',
    hovered: null,
    selectedUser: null,
  },
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setHovered: (state, action) => {
      state.hovered = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Swal.fire('Error', 'Failed to fetch users', 'error');
      })
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const { id, data } = action.payload;
        const userIndex = state.users.findIndex((u) => u.id === id);
        if (userIndex !== -1) {
          state.users[userIndex] = { ...state.users[userIndex], ...data };
        }
        Swal.fire('Success!', 'User updated successfully.', 'success');
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        Swal.fire('Error', action.payload, 'error');
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
      })
      .addCase(deleteUser.rejected, (state, action) => {
        Swal.fire('Error', action.payload, 'error');
      });
  },
});

export const {
  setSearch,
  setFilter,
  setSort,
  setHovered,
  setSelectedUser,
  clearError,
} = usersSlice.actions;

export default usersSlice.reducer;
