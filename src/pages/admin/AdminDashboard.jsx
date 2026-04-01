import React, { useEffect, useState } from "react";
import {
    Users,
    Package,
    ShieldCheck,
    ShoppingCart,
    CalendarClock,
    Building2,
    Bell,
    ArrowRight,
    RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminService } from "@/services/admin.service";
import "./AdminDashboard.css";

const statCards = [
    {
        key: "totalUsers",
        label: "Total Users",
        icon: Users,
        route: "/admin/users",
        description: "Manage accounts, roles, and statuses",
    },
    {
        key: "totalListings",
        label: "Total Listings",
        icon: Package,
        route: "/admin/listings",
        description: "Review and moderate marketplace listings",
    },
    {
        key: "pendingVerifications",
        label: "Pending Verifications",
        icon: ShieldCheck,
        route: "/admin/verifications",
        description: "Approve or reject verification requests",
    },
    {
        key: "totalOrders",
        label: "Total Orders",
        icon: ShoppingCart,
        route: "/admin/orders",
        description: "Track and manage all platform orders",
    },
    {
        key: "totalReservations",
        label: "Total Reservations",
        icon: CalendarClock,
        route: "/admin/reservations",
        description: "Handle NGO reservations and pickup flow",
    },
    {
        key: "totalBusinessProfiles",
        label: "Business Profiles",
        icon: Building2,
        route: "/admin/profiles",
        description: "Inspect business and personal profiles",
    },
];

const quickLinks = [
    {
        title: "User Management",
        text: "Edit users, suspend accounts, and manage roles.",
        route: "/admin/users",
        icon: Users,
    },
    {
        title: "Verification Queue",
        text: "Open pending verification requests for review.",
        route: "/admin/verifications",
        icon: ShieldCheck,
    },
    {
        title: "Listings Control",
        text: "Close, inspect, or delete marketplace listings.",
        route: "/admin/listings",
        icon: Package,
    },
    {
        title: "Orders Overview",
        text: "Monitor orders, inspect payment state, and resolve disputes.",
        route: "/admin/orders",
        icon: ShoppingCart,
    },
    {
        title: "Reservations",
        text: "View NGO reservations and manage reservation status.",
        route: "/admin/reservations",
        icon: CalendarClock,
    },
    {
        title: "Admin Inbox",
        text: "Review staff contact requests, disputes, and admin alerts.",
        route: "/admin/notifications",
        icon: Bell,
    },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getDashboardStats();
            setStats(data);
        } catch (err) {
            setError(err.message || "Failed to load dashboard stats.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading dashboard...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <div className="admin-topbar">
                        <div>
                            <h1>Admin Dashboard</h1>
                            <p>Overview of marketplace activity, escalation queues, and platform operations.</p>
                        </div>
                    </div>

                    <div className="admin-dashboard-error">
                        <h2>{error}</h2>
                        <button className="admin-refresh-btn" onClick={loadStats}>
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-topbar">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p>Overview of marketplace activity, escalation queues, and platform operations.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadStats}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-stats-grid">
                    {statCards.map(({ key, label, icon: Icon, route, description }) => (
                        <button
                            key={key}
                            className="admin-stat-card admin-stat-card-clickable"
                            onClick={() => navigate(route)}
                            type="button"
                        >
                            <div className="admin-stat-card-top">
                                <div className="admin-stat-icon">
                                    <Icon size={22} />
                                </div>

                                <div className="admin-stat-arrow">
                                    <ArrowRight size={18} />
                                </div>
                            </div>

                            <div className="admin-stat-text">
                                <span>{label}</span>
                                <strong>{stats?.[key] ?? 0}</strong>
                            </div>

                            <p className="admin-stat-description">{description}</p>
                        </button>
                    ))}
                </div>

                <div className="admin-dashboard-section">
                    <div className="admin-dashboard-section-head">
                        <h2>Quick Actions</h2>
                        <p>Jump straight into the main administration areas.</p>
                    </div>

                    <div className="admin-quick-grid">
                        {quickLinks.map(({ title, text, route, icon: Icon }) => (
                            <button
                                key={title}
                                className="admin-quick-card"
                                onClick={() => navigate(route)}
                                type="button"
                            >
                                <div className="admin-quick-icon">
                                    <Icon size={20} />
                                </div>

                                <div className="admin-quick-content">
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </div>

                                <div className="admin-quick-arrow">
                                    <ArrowRight size={18} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
