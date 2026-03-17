import React, { useMemo, useState } from "react";
import { Bell, RefreshCw, Send, Search } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminNotifications.css";

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function AdminNotifications() {
    const [form, setForm] = useState({
        userId: "",
        type: "",
        message: "",
    });

    const [notifications, setNotifications] = useState([]);
    const [searchUserId, setSearchUserId] = useState("");
    const [loadedUserId, setLoadedUserId] = useState("");

    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const filteredNotifications = useMemo(() => {
        return notifications;
    }, [notifications]);

    async function loadNotificationsByUser(userId) {
        if (!userId.trim()) return;

        try {
            setLoading(true);
            setError("");
            const data = await adminService.getNotificationsByUser(userId.trim());
            setNotifications(data || []);
            setLoadedUserId(userId.trim());
        } catch (err) {
            setError(err.message || "Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateNotification(e) {
        e.preventDefault();

        if (!form.userId.trim() || !form.type.trim() || !form.message.trim()) {
            alert("Please fill all notification fields.");
            return;
        }

        try {
            setCreating(true);
            setError("");

            const created = await adminService.createNotification({
                userId: form.userId.trim(),
                type: form.type.trim(),
                message: form.message.trim(),
            });

            if (loadedUserId === form.userId.trim()) {
                setNotifications((prev) => [created, ...prev]);
            }

            setForm({
                userId: "",
                type: "",
                message: "",
            });
        } catch (err) {
            setError(err.message || "Failed to create notification.");
        } finally {
            setCreating(false);
        }
    }

    async function markRead(id, read) {
        try {
            const updated = await adminService.markNotificationRead(id, read);
            setNotifications((prev) => prev.map((item) => (item.id === id ? updated : item)));
        } catch (err) {
            alert(err.message || "Failed to update notification.");
        }
    }

    async function deleteNotification(id) {
        const confirmed = window.confirm("Delete this notification?");
        if (!confirmed) return;

        try {
            await adminService.deleteNotification(id);
            setNotifications((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            alert(err.message || "Failed to delete notification.");
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-section-header">
                    <div>
                        <h1>Notifications</h1>
                        <p>Create platform notifications for users and manage notification status.</p>
                    </div>
                </div>

                <div className="admin-notifications-layout">
                    <div className="admin-notification-form-card">
                        <h2>Create Notification</h2>

                        <form onSubmit={handleCreateNotification} className="admin-notification-form">
                            <div className="admin-form-group">
                                <label>User ID</label>
                                <input
                                    type="text"
                                    value={form.userId}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, userId: e.target.value }))
                                    }
                                    placeholder="Enter target user id"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Type</label>
                                <input
                                    type="text"
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, type: e.target.value }))
                                    }
                                    placeholder="Example: SYSTEM, ORDER_UPDATE, WARNING"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Message</label>
                                <textarea
                                    rows="6"
                                    value={form.message}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, message: e.target.value }))
                                    }
                                    placeholder="Write notification message"
                                />
                            </div>

                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary admin-notification-submit"
                                disabled={creating}
                            >
                                <Send size={16} />
                                {creating ? "Sending..." : "Send Notification"}
                            </button>
                        </form>
                    </div>

                    <div className="admin-notification-list-card">
                        <div className="admin-notification-list-header">
                            <h2>User Notifications</h2>

                            <div className="admin-notification-search-row">
                                <div className="admin-search-box">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter user id"
                                        value={searchUserId}
                                        onChange={(e) => setSearchUserId(e.target.value)}
                                    />
                                </div>

                                <button
                                    className="admin-refresh-btn"
                                    onClick={() => loadNotificationsByUser(searchUserId)}
                                >
                                    <RefreshCw size={16} />
                                    Load
                                </button>
                            </div>
                        </div>

                        {error && <p className="admin-notification-error">{error}</p>}

                        {loading ? (
                            <div className="admin-empty-detail">
                                <Bell size={28} />
                                <h3>Loading notifications...</h3>
                            </div>
                        ) : !loadedUserId ? (
                            <div className="admin-empty-detail">
                                <Bell size={28} />
                                <h3>No user loaded</h3>
                                <p>Search by user id to view their notifications.</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="admin-empty-detail">
                                <Bell size={28} />
                                <h3>No notifications found</h3>
                                <p>This user currently has no notifications.</p>
                            </div>
                        ) : (
                            <div className="admin-notification-list">
                                {filteredNotifications.map((item) => (
                                    <div key={item.id} className="admin-notification-item">
                                        <div className="admin-notification-top">
                                            <div>
                                                <strong>{item.type || "Notification"}</strong>
                                                <p>{item.message || "—"}</p>
                                            </div>

                                            <span
                                                className={`admin-badge ${
                                                    item.read
                                                        ? "admin-badge-approved"
                                                        : "admin-badge-pending"
                                                }`}
                                            >
                                                {item.read ? "READ" : "UNREAD"}
                                            </span>
                                        </div>

                                        <div className="admin-notification-meta">
                                            <span>ID: {item.id}</span>
                                            <span>User: {item.userId}</span>
                                            <span>Created: {formatDate(item.createdAt)}</span>
                                        </div>

                                        <div className="admin-actions">
                                            <button
                                                className="admin-btn"
                                                onClick={() => markRead(item.id, !item.read)}
                                            >
                                                Mark as {item.read ? "Unread" : "Read"}
                                            </button>

                                            <button
                                                className="admin-btn admin-btn-danger"
                                                onClick={() => deleteNotification(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}