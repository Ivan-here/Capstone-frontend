import { Link } from "react-router-dom";
import logo from "./logo.jpeg"; // 👈 your actual image


export default function Splash() {
  return (
    <div className="splash-container">
      <img src={logo} alt="Locally logo" className="splash-logo" />

      <h1>Locally</h1>
      <p>Local Food Service App</p>

      <div className="splash-actions">
        <Link to="/login">Login</Link>
        <Link to="/register/step-1">Register</Link>
      </div>
    </div>
  );
}
