import "./styles/Footer.css"
import { logout } from "../features/authSlice";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const Footer = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const handleLogout = async () => {
        try {
            await signOut(auth);
            dispatch(logout());
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };
    return (
        <footer className="footer">
            <div className="footer-text">© Ujaas Aroma Inc. All rights reserved 2026.</div>
            <div onClick={handleLogout} className="footer-btn" >
                <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 20, color: 'red' }}></i>
            </div>
        </footer>
    )
}

export default Footer;