import React, { useState } from 'react';
import { Bell, ShoppingCart, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/globals.css';
import Notifications from '../../pages/notification/Notifications.jsx';

const NavbarNGO = () => {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const isCartActive = location.pathname === '/cart';
    const isProfileActive = location.pathname.indexOf("/profile") === 0;
    const token = localStorage.getItem("accessToken");
    const userLink = token ? "/profile" : "/login";

    return (
        <div className="navbar-wrapper relative">
            <div className="navbar-top">
                <div className="nav-spacer"></div>
                <h1 className="nav-title">LOCALLY</h1>
                <div className="nav-icons">
                    {/* BELL ICON */}
                    <button
                        className={`btn-icon ${showNotifications ? "is-active" : ""}`}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={22} />
                    </button>

                    {/* --- UPDATED SECTION START --- */}
                    {/* CART ICON: Linked to /cart with Active Style */}
                    <Link to="/cart">
                        <button
                            className={`btn-icon ${isCartActive ? "is-active" : ""}`}
                        >
                            <ShoppingCart size={22} />
                        </button>
                    </Link>
                    {/* --- UPDATED SECTION END --- */}
                    <Link to={userLink}>
                        <button
                            className={`btn-icon ${isProfileActive ? "is-active" : ""}`}
                        >
                            <User size={22} />
                        </button>
                    </Link>
                    <button className="btn-icon">
                        <Settings size={22} />
                    </button>
                </div>
            </div>

            <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

            {/* BOTTOM TABS: Community | Browse | NGO's Hub */}
            <div className="navbar-bottom">
                <Link to="/community" className={`nav-tab ${location.pathname === '/community' ? 'active' : ''}`}>
                    COMMUNITY
                </Link>

                <div className="nav-divider"></div>

                <Link to="/browse" className={`nav-tab ${location.pathname.includes('/browse') || location.pathname.includes('/product') ? 'active' : ''}`}>
                    BROWSE
                </Link>

                <div className="nav-divider"></div>

                <Link to="/ngo-hub" className={`nav-tab ${location.pathname === '/ngo-hub' ? 'active' : ''}`}>
                    NGO'S HUB
                </Link>
            </div>
        </div>
    );
};

export default NavbarNGO;