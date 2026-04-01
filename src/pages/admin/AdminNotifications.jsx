import React, { useEffect, useMemo, useState } from "react";
import { Bell, RefreshCw, Send, Search, Inbox, ShieldAlert, MessageSquareWarning, ExternalLink } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminService } from "@/services/admin.service";
import "./AdminNotifications.css";

const SCOPE_FILTERS = [
    { key: "all", label: "All Inbox" },
    { key: "staff", label: "Staff Requests" },
    { key: "disputes", label: "Order Disputes" },
    { key: "unread", label: "Unread" },
];

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

function normalizeScope(value) {
    if (value === "staff" || value === "disputes" || value === "unread") {
        return value;
    }
    return "all";
}

function isStaffRequest(notification) {
    return notification?.type === "STAFF_REQUEST" || notification?.referenceType === "STAFF_REQUEST";
}

function isOrderDispute(notification) {
    return notification?.referenceType === "ORDER";
}

function resolveNotificationTitle(notification) {
    return notification?.title?.trim() || notification?.type || "Notification";
}

export default function AdminNotifications() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [form, setForm] = useState({
        userId: "",
        type: "",
        message: "",
    });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [scope, setScope] = useState(() => normalizeScope(searchParams.get("scope")));

    useEffect(() => {
        loadInbox();
    }, []);

    useEffect(() => {
        const nextScope = normalizeScope(searchParams.get("scope"));
        setScope((current) => (current === nextScope ? current : nextScope));
    }, [searchParams]);

    async function loadInbox() {
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getMyNotifications();
            setNotifications(data || []);
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
            await adminService.createNotification({
                userId: form.userId.trim(),
                type: form.type.trim(),
                message: form.message.trim(),
            });
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

    function updateScope(nextScope) {
        setScope(nextScope);
        const nextParams = new URLSearchParams(searchParams);
        if (nextScope === "all") {
            nextParams.delete("scope");
        } else {
            nextParams.set("scope", nextScope);
        }
        setSearchParams(nextParams, { replace: true });
    }

    function openReference(notification) {
        const orderId = notification?.referenceType === "ORDER" ? notification?.referenceId : "";
        if (orderId) {
            navigate(`/admin/orders?orderId=${orderId}`);
            return;
        }

        if (notification?.targetUrl) {
            navigate(notification.targetUrl);
        }
    }

    const summary = useMemo(() => {
        const total = notifications.length;
        const unread = notifications.filter((item) => !item.read).length;
        const staff = notifications.filter(isStaffRequest).length;
        const disputes = notifications.filter(isOrderDispute).length;
        return { total, unread, staff, disputes };
    }, [notifications]);

    const filteredNotifications = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return notifications.filter((item) => {
            const matchesScope =
                scope === "all" ||
                (scope === "staff" && isStaffRequest(item)) ||
                (scope === "disputes" && isOrderDispute(item)) ||
                (scope === "unread" && !item.read);

            const haystack = [
                item.id,
                item.type,
                item.title,
                item.message,
                item.referenceType,
                item.referenceId,
                item.actorDisplayName,
                item.actorUsername,
                item.actorUserId,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return matchesScope && (!query || haystack.includes(query));
        });
    }, [notifications, scope, searchTerm]);

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-section-header">
                    <div>
                        <h1>Admin Inbox</h1>
                        <p>Staff contact requests and order disputes land here for the signed-in admin automatically.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadInbox}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-notification-summary-grid">
                    <div className="admin-notification-summary-card">
                        <div className="admin-notification-summary-icon"><Inbox size={18} /></div>
                        <span>Total</span>
                        <strong>{summary.total}</strong>
                    </div>
                    <div className="admin-notification-summary-card">
                        <div className="admin-notification-summary-icon"><Bell size={18} /></div>
                        <span>Unread</span>
                        <strong>{summary.unread}</strong>
                    </div>
                    <div className="admin-notification-summary-card">
                        <div className="admin-notification-summary-icon"><ShieldAlert size={18} /></div>
                        <span>Staff Requests</span>
                        <strong>{summary.staff}</strong>
                    </div>
                    <div className="admin-notification-summary-card">
                        <div className="admin-notification-summary-icon"><MessageSquareWarning size={18} /></div>
                        <span>Order Disputes</span>
                        <strong>{summary.disputes}</strong>
                    </div>
                </div>

                <div className="admin-notifications-layout">
                    <div className="admin-notification-list-card admin-notification-inbox-card">
                        <div className="admin-notification-list-header">
                            <div>
                                <h2>Inbox</h2>
                                <p className="admin-notification-subtitle">Review incoming staff requests, unread alerts, and dispute escalations.</p>
                            </div>

                            <div className="admin-search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by sender, message, type, order id"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="admin-notification-filter-row">
                            {SCOPE_FILTERS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    className={`admin-filter-chip ${scope === item.key ? "active" : ""}`}
                                    onClick={() => updateScope(item.key)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {error && <p className="admin-notification-error">{error}</p>}

                        {loading ? (
                            <div className="admin-empty-detail">
                                <Bell size={28} />
                                <h3>Loading inbox...</h3>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="admin-empty-detail">
                                <Bell size={28} />
                                <h3>No notifications found</h3>
                                <p>No inbox items match the current filter.</p>
                            </div>
                        ) : (
                            <div className="admin-notification-list">
                                {filteredNotifications.map((item) => (
                                    <div key={item.id} className={`admin-notification-item ${item.read ? "" : "is-unread"}`}>
                                        <div className="admin-notification-top">
                                            <div>
                                                <strong>{resolveNotificationTitle(item)}</strong>
                                                <p>{item.message || "-"}</p>
                                            </div>

                                            <div className="admin-notification-badges">
                                                <span className={`admin-badge ${item.read ? "admin-badge-approved" : "admin-badge-pending"}`}>
                                                    {item.read ? "READ" : "UNREAD"}
                                                </span>
                                                {isOrderDispute(item) ? (
                                                    <span className="admin-badge admin-badge-ready_for_pickup">ORDER</span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="admin-notification-meta">
                                            <span>ID: {item.id}</span>
                                            <span>From: {item.actorDisplayName || item.actorUsername || item.actorUserId || "-"}</span>
                                            <span>Created: {formatDate(item.createdAt)}</span>
                                            {item.referenceId ? <span>Reference: {item.referenceType} #{item.referenceId}</span> : null}
                                        </div>

                                        <div className="admin-actions">
                                            {(item.targetUrl || item.referenceId) ? (
                                                <button className="admin-btn admin-btn-primary" onClick={() => openReference(item)}>
                                                    <ExternalLink size={15} />
                                                    Open
                                                </button>
                                            ) : null}
                                            <button className="admin-btn" onClick={() => markRead(item.id, !item.read)}>
                                                Mark as {item.read ? "Unread" : "Read"}
                                            </button>
                                            <button className="admin-btn admin-btn-danger" onClick={() => deleteNotification(item.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="admin-notification-form-card">
                        <h2>Create Notification</h2>
                        <p className="admin-notification-subtitle">Send a manual platform message when you need to contact a user directly.</p>

                        <form onSubmit={handleCreateNotification} className="admin-notification-form">
                            <div className="admin-form-group">
                                <label>User ID</label>
                                <input
                                    type="text"
                                    value={form.userId}
                                    onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                                    placeholder="Enter target user id"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Type</label>
                                <input
                                    type="text"
                                    value={form.type}
                                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                                    placeholder="Example: SYSTEM, ORDER_UPDATE, WARNING"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Message</label>
                                <textarea
                                    rows="6"
                                    value={form.message}
                                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
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
                </div>
            </div>
        </div>
    );
}
