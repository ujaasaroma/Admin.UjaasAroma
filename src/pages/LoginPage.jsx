import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { loginStart, loginSuccess, loginFailure } from '../features/authSlice';
import '../styles/LoginPage.css'; // 👈 Add this line

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      dispatch(loginFailure('Invalid email format'));
      return;
    }
    if (password.length < 6) {
      dispatch(loginFailure('Password must be at least 6 characters'));
      return;
    }

    dispatch(loginStart());
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists() && userDoc.data().admin === 1) {
        const userData = userDoc.data();

        // ✅ include Firestore name
        dispatch(loginSuccess({
          uid: user.uid,
          email: user.email,
          name: userData.name || userData.displayName || 'User'
        }));

        navigate('/dashboard');
      } else {
        dispatch(loginFailure('Access denied. Admin login only.'));
      }
    } catch (err) {
      dispatch(loginFailure(err.message || 'Login failed'));
    }
  };


  return (
    <div className="login-page">
      <div className='login-box'>
        <div className="login-header">
          <h3>Admin Panel</h3>
        </div>
        <div className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <p className="error-text">{error}</p>}

            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="remember-row">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="remember-text">Remember me</span>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Loading...' : 'Sign in'}
            </button>

            <p className="forgot-text">
              <span onClick={() => navigate('/forgotPassword')}>Forgot Password</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
