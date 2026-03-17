import React, { useState } from 'react';
import { Bell, ShoppingCart, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/globals.css';
import Notifications from '../../pages/notification/Notifications.jsx';

const NavbarAdmin = () => {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);

    const token = localStorage.getItem("accessToken");
    const userLink = token ? "/profile" : "/login";

    const isCartActive = location.pathname === '/cart';
    const isProfileActive = location.pathname.indexOf("/profile") === 0;
    const isAdminActive = location.pathname.startsWith("/admin");

    return (
        <div className="navbar-wrapper relative">
            <div className="navbar-top">
                <div className="nav-spacer"></div>
                <h1 className="nav-title">LOCALLY</h1>

                <div className="nav-icons">
                    <button
                        className={`btn-icon ${showNotifications ? "is-active" : ""}`}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={22} />
                    </button>

                    <Link to="/cart">
                        <button className={`btn-icon ${isCartActive ? "is-active" : ""}`}>
                            <ShoppingCart size={22} />
                        </button>
                    </Link>

                    <Link to={userLink}>
                        <button className={`btn-icon ${isProfileActive ? "is-active" : ""}`}>
                            <User size={22} />
                        </button>
                    </Link>

                    <button className="btn-icon">
                        <Settings size={22} />
                    </button>
                </div>
            </div>

            <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

            <div className="navbar-bottom">
                <Link
                    to="/community"
                    className={`nav-tab ${location.pathname === '/community' ? 'active' : ''}`}
                >
                    COMMUNITY
                </Link>

                <div className="nav-divider"></div>

                <Link
                    to="/browse"
                    className={`nav-tab ${location.pathname.includes('/browse') || location.pathname.includes('/product') ? 'active' : ''}`}
                >
                    BROWSE
                </Link>

                <div className="nav-divider"></div>

                <Link
                    to="/farmer-hub"
                    className={`nav-tab ${location.pathname === '/farmer-hub' ? 'active' : ''}`}
                >
                    FARMER'S HUB
                </Link>

                <div className="nav-divider"></div>

                <Link
                    to="/restaurant-hub"
                    className={`nav-tab ${location.pathname === '/restaurant-hub' ? 'active' : ''}`}
                >
                    RESTAURANT'S HUB
                </Link>

                <div className="nav-divider"></div>

                <Link
                    to="/admin/dashboard"
                    className={`nav-tab ${isAdminActive ? 'active' : ''}`}
                >
                    ADMIN PANEL
                </Link>
            </div>
        </div>
    );
};

export default NavbarAdmin;