import React, { useEffect, useState } from "react";
import { Users, Package, ShieldCheck, ShoppingCart, CalendarClock, Building2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminDashboard.css";

const statCards = [
    { key: "totalUsers", label: "Total Users", icon: Users },
    { key: "totalListings", label: "Total Listings", icon: Package },
    { key: "pendingVerifications", label: "Pending Verifications", icon: ShieldCheck },
    { key: "totalOrders", label: "Total Orders", icon: ShoppingCart },
    { key: "totalReservations", label: "Total Reservations", icon: CalendarClock },
    { key: "totalBusinessProfiles", label: "Business Profiles", icon: Building2 },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                    <h2>{error}</h2>
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
                        <p>Overview of marketplace activity and platform operations.</p>
                    </div>
                </div>

                <div className="admin-stats-grid">
                    {statCards.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="admin-stat-card">
                            <div className="admin-stat-icon">
                                <Icon size={22} />
                            </div>
                            <div className="admin-stat-text">
                                <span>{label}</span>
                                <strong>{stats?.[key] ?? 0}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}