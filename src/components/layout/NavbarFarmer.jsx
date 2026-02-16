import React, { useState } from 'react';
import { Bell, ShoppingCart, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/globals.css';
import Notifications from '../../pages/notification/Notifications.jsx';

const NavbarFarmer = () => {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const token = localStorage.getItem("accessToken");
    const userLink = token ? "/profile" : "/login";

    // Helper: Check if we are on the Cart page
    const isCartActive = location.pathname === '/cart';

    return (
        <div className="navbar-wrapper relative">

            {/* TOP BAR */}
            <div className="navbar-top">
                <div className="nav-spacer"></div>
                <h1 className="nav-title">WELCOME</h1>
                <div className="nav-icons">
                    <button className="btn-icon" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={24} />
                    </button>

                    <Link to="/cart">
                        <button
                            className="btn-icon"
                            style={isCartActive ? { backgroundColor: '#8B4513', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
                        >
                            <ShoppingCart size={24} />
                        </button>
                    </Link>

                    <Link to={userLink} className="btn-icon">
                        <User size={24} />
                    </Link>
                    <button className="btn-icon"><Settings size={24} /></button>
                </div>
            </div>

            <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

            {/* BOTTOM TABS: Community | Browse | Farmer's Hub */}
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
            </div>
        </div>
    );
};

export default NavbarFarmer;