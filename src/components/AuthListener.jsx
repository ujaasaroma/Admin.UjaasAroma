import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { loginSuccess, logout, fetchUserProfile } from "../features/authSlice";

export default function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        dispatch(
          loginSuccess({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          })
        );

        // Fetch additional data from Firestore
        dispatch(fetchUserProfile(user.uid));
      } else {
        // User is signed out
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null; // This component doesn't render anything
}
