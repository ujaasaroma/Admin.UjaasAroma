import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase"; // ✅ now correctly exported
import "../styles/LoginPage.css";
import "../styles/ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setCountdown(5);

    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      setError("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      // ✅ Call your Cloud Function instead of querying Firestore
      const sendEmail = httpsCallable(functions, "sendAdminPasswordResetEmail");
      const result = await sendEmail({ email: trimmedEmail }); // ⚠️ Pass as object
      console.log("Function response:", result.data);
      alert("Password reset email sent!");

      if (result.data?.success) {
        setMessage("Password reset email sent! Redirecting to login...");
      } else {
        setError("Failed to send password reset email");
      }
    } catch (err) {
      console.error("Error sending reset email:", err);
      setError(
        err.message ||
        "Failed to send reset email. Please try again or contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Countdown & redirect logic
  useEffect(() => {
    if (message) {
      const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      const redirectTimer = setTimeout(() => navigate("/"), 5000);

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
                {message.split("Redirecting")[0]}
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
