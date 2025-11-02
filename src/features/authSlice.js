import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const initialState = {
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null,
};

// ✅ Async thunk to fetch user profile from Firestore
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (uid, { rejectWithValue }) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.isLoggedIn = false;
      state.user = null;
    },
    logout(state) {
      state.user = null;
      state.isLoggedIn = false;
      state.error = null;
    },
    // ✅ Update user profile data
    updateUserProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        if (action.payload && state.user) {
          // Merge Firestore data with existing auth data
          state.user = {
            ...state.user,
            ...action.payload,
          };
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        console.error("Failed to fetch user profile:", action.payload);
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserProfile,
} = authSlice.actions;

// ✅ Custom thunk to handle full logout flow
export const performLogout = () => async (dispatch) => {
  try {
    dispatch(logout()); // clear auth state
  } catch (error) {
    console.error("Error during logout cleanup:", error);
  }
};

export default authSlice.reducer;
