import React, { useState } from 'react';
import { Bell, ShoppingCart, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/globals.css';
import Notifications from '../../pages/notification/Notifications.jsx';

const Navbar = () => {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const token = localStorage.getItem("accessToken");
    const userLink = token ? "/profile" : "/login";

    // Helper: Check if we are currently on the Cart page
    const isCartActive = location.pathname === '/cart';

    return (
        <div className="navbar-wrapper relative">

            {/* TOP BAR */}
            <div className="navbar-top">
                <div className="nav-spacer"></div>

                <h1 className="nav-title">WELCOME</h1>

                <div className="nav-icons">
                    {/* BELL ICON */}
                    <button
                        className="btn-icon"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={24} />
                    </button>

                    {/* --- UPDATED SECTION START --- */}
                    {/* CART ICON: Linked to /cart with Active Style */}
                    <Link to="/cart">
                        <button
                            className="btn-icon"
                            style={isCartActive ? {
                                backgroundColor: '#8B4513', // Brown background
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            } : {}}
                        >
                            <ShoppingCart size={24} />
                        </button>
                    </Link>
                    {/* --- UPDATED SECTION END --- */}
                    <Link to={userLink} className="btn-icon">
                        <User size={24} />
                    </Link>
                    <button className="btn-icon"><Settings size={24} /></button>
                </div>
            </div>

            {/* NOTIFICATION COMPONENT */}
            <Notifications
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />

            {/* BOTTOM TABS */}
            <div className="navbar-bottom">
                <Link
                    to="/browse"
                    className={`nav-tab ${location.pathname.includes('/browse') || location.pathname.includes('/product') ? 'active' : ''}`}
                >
                    BROWSE
                </Link>
                <div className="nav-divider"></div>
                <Link
                    to="/community"
                    className={`nav-tab ${location.pathname === '/community' ? 'active' : ''}`}
                >
                    COMMUNITY
                </Link>
            </div>
        </div>
    );
};

export default Navbar;