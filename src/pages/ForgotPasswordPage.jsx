// src/pages/ForgotPasswordPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../config/firebase";
import "./styles/LoginPage.css";
import "./styles/ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // ✅ Email validation
  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  // ✅ Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      // 🔍 Step 1: Check if email exists in Firestore and is admin
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No user found with this email.");
        setLoading(false);
        return;
      }

      const userData = snapshot.docs[0].data();

      if (userData.admin !== 1) {
        setError("Access denied. Only admin users can reset password here.");
        setLoading(false);
        return;
      }

      // ✉️ Step 2: Send password reset email
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent successfully! Redirecting in ");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Countdown + redirect logic
  useEffect(() => {
    if (message) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      const redirectTimer = setTimeout(() => {
        navigate("/");
      }, 5000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimer);
      };
    }
  }, [message, navigate]);

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <h3>Forgot Password</h3>
        </div>
        <div className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <p className="error-text">{error}</p>}
            {message && (
              <p className="success-text">
                {message}
                <span className="countdown"> {countdown}</span>...
              </p>
            )}

            <input
              type="email"
              placeholder="Email" 
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Sending..." : "Send Password Reset Email"}
            </button>

            <p className="forgot-text">
              <span onClick={() => navigate("/")}>Back to login</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
