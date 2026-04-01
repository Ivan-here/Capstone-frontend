import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, ShoppingCart, BellRing } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "@/services/admin.service";
import "./AdminOrders.css";

const ORDER_STATUSES = [
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "READY_FOR_PICKUP",
    "PICKUP_CODE_VERIFIED",
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
];

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

function formatPrice(cents) {
    if (cents == null) return "-";
    return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function AdminOrders() {
    const [searchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [disputeReason, setDisputeReason] = useState("");
    const [disputeRefund, setDisputeRefund] = useState(false);
    const [disputeBusy, setDisputeBusy] = useState(false);

    useEffect(() => {
        loadOrders();
        loadNotifications();
    }, []);

    function refreshData() {
        loadOrders();
        loadNotifications();
    }

    async function loadOrders() {
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getAllOrders();
            setOrders(data || []);
        } catch (err) {
            setError(err.message || "Failed to load orders.");
        } finally {
            setLoading(false);
        }
    }

    async function loadNotifications() {
        try {
            const data = await adminService.getMyNotifications();
            setNotifications(data || []);
        } catch {
            setNotifications([]);
        }
    }

    useEffect(() => {
        const orderId = searchParams.get("orderId");
        if (!orderId || orders.length === 0) return;

        const match = orders.find((item) => item.id === orderId);
        if (match) {
            setSelectedOrder(match);
        }
    }, [orders, searchParams]);

    const filteredOrders = useMemo(() => (
        orders.filter((item) => {
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !q ||
                item.id?.toLowerCase().includes(q) ||
                item.shopperId?.toLowerCase().includes(q) ||
                item.sellerUserId?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q) ||
                item.paymentStatus?.toLowerCase().includes(q);

            const matchesStatus = !statusFilter || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
    ), [orders, searchTerm, statusFilter]);

    const selectedOrderAlerts = useMemo(() => {
        if (!selectedOrder?.id) return [];
        return notifications.filter(
            (item) => item.referenceType === "ORDER" && item.referenceId === selectedOrder.id
        );
    }, [notifications, selectedOrder]);

    async function disputeOrder(orderId) {
        if (!disputeReason.trim()) {
            alert("Please provide a dispute reason.");
            return;
        }

        try {
            setDisputeBusy(true);
            const updated = await adminService.disputeOrder(orderId, {
                adminUserId: localStorage.getItem("userId") || "ADMIN",
                reason: disputeReason.trim(),
                refundPayment: disputeRefund,
            });

            setOrders((prev) => prev.map((item) => (item.id === orderId ? updated : item)));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(updated);
            }
            setDisputeReason("");
            setDisputeRefund(false);
        } catch (err) {
            alert(err.message || "Failed to dispute order.");
        } finally {
            setDisputeBusy(false);
        }
    }

    async function deleteOrder(orderId) {
        const confirmed = window.confirm("Delete this order?");
        if (!confirmed) return;

        try {
            await adminService.deleteOrder(orderId);
            setOrders((prev) => prev.filter((item) => item.id !== orderId));
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
        } catch (err) {
            alert(err.message || "Failed to delete order.");
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading orders...</h2>
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
                <div className="admin-section-header">
                    <div>
                        <h1>Orders</h1>
                        <p>Inspect checkout, payment, pickup, and dispute state for marketplace orders.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={refreshData}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by order id, shopper id, seller id, status or payment status"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="admin-listings-grid">
                    <div className="admin-listings-table-panel">
                        <div className="admin-users-table-wrap">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Total</th>
                                        <th>Items</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Order Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="admin-empty-row">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-user-avatar">
                                                            <ShoppingCart size={16} />
                                                        </div>
                                                        <div>
                                                            <strong>{item.id}</strong>
                                                            <p>Buyer: {item.shopperId || "-"}</p>
                                                            <span>Seller: {item.sellerUserId || "-"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{formatPrice(item.grossAmountCents)}</td>
                                                <td>{item.items?.length ?? 0}</td>
                                                <td>{item.status || "-"}</td>
                                                <td>{item.paymentStatus || "-"}</td>
                                                <td>{formatDate(item.orderDate)}</td>
                                                <td>
                                                    <div className="admin-actions">
                                                        <button className="admin-btn" onClick={() => setSelectedOrder(item)}>
                                                            View
                                                        </button>
                                                        <button className="admin-btn admin-btn-danger" onClick={() => deleteOrder(item.id)}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="admin-listing-detail-panel">
                        {selectedOrder ? (
                            <>
                                <div className="admin-detail-header">
                                    <h2>Order Details</h2>
                                    <button className="admin-btn" onClick={() => setSelectedOrder(null)}>
                                        Close
                                    </button>
                                </div>

                                <div className="admin-detail-grid">
                                    <div className="admin-detail-group">
                                        <label>Order ID</label>
                                        <p>{selectedOrder.id}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Buyer ID</label>
                                        <p>{selectedOrder.shopperId || "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Seller ID</label>
                                        <p>{selectedOrder.sellerUserId || "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Gross Amount</label>
                                        <p>{formatPrice(selectedOrder.grossAmountCents)}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Platform Fee</label>
                                        <p>{formatPrice(selectedOrder.platformFeeCents)}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Seller Amount</label>
                                        <p>{formatPrice(selectedOrder.sellerAmountCents)}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Status</label>
                                        <p>{selectedOrder.status || "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Payment Status</label>
                                        <p>{selectedOrder.paymentStatus || "-"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Pickup Location</label>
                                        <p>{selectedOrder.pickupLocation || "-"}</p>
                                    </div>
                                </div>

                                <div className="admin-detail-group">
                                    <label>Items</label>
                                    {(selectedOrder.items || []).length > 0 ? (
                                        <ul className="admin-simple-list">
                                            {selectedOrder.items.map((item) => (
                                                <li key={`${item.listingId}-${item.quantity}-${item.title}`}>
                                                    {item.title || item.listingId} x{item.quantity} at {formatPrice(item.unitPriceCents)} each
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>-</p>
                                    )}
                                </div>

                                <div className="admin-detail-group">
                                    <label>Dispute / Refund</label>
                                    <div className="admin-verification-review-box">
                                        <textarea
                                            rows="4"
                                            placeholder="Reason for dispute"
                                            value={disputeReason}
                                            onChange={(e) => setDisputeReason(e.target.value)}
                                        />
                                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={disputeRefund}
                                                onChange={(e) => setDisputeRefund(e.target.checked)}
                                            />
                                            Refund payment if funds are still held
                                        </label>
                                        <button
                                            className="admin-btn admin-btn-danger"
                                            onClick={() => disputeOrder(selectedOrder.id)}
                                            disabled={disputeBusy}
                                        >
                                            {disputeBusy ? "Processing..." : "Open Dispute"}
                                        </button>
                                    </div>
                                </div>

                                <div className="admin-detail-group">
                                    <label>Related Alerts</label>
                                    {selectedOrderAlerts.length > 0 ? (
                                        <div className="admin-order-alerts">
                                            {selectedOrderAlerts.map((item) => (
                                                <div key={item.id} className={`admin-order-alert ${item.read ? "" : "is-unread"}`}>
                                                    <div className="admin-order-alert-head">
                                                        <div className="admin-order-alert-title">
                                                            <BellRing size={15} />
                                                            <strong>{item.title || item.type || "Order alert"}</strong>
                                                        </div>
                                                        <span className={`admin-badge ${item.read ? "admin-badge-approved" : "admin-badge-pending"}`}>
                                                            {item.read ? "READ" : "UNREAD"}
                                                        </span>
                                                    </div>
                                                    <p>{item.message || "-"}</p>
                                                    <span>
                                                        From {item.actorDisplayName || item.actorUsername || item.actorUserId || "-"} at {formatDate(item.createdAt)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No admin alerts are linked to this order yet.</p>
                                    )}
                                </div>

                                <div className="admin-detail-group">
                                    <label>Status History</label>
                                    {(selectedOrder.history || []).length > 0 ? (
                                        <div className="admin-timeline">
                                            {selectedOrder.history.map((entry, index) => (
                                                <div key={`${entry.status}-${entry.time}-${index}`} className="admin-timeline-item">
                                                    <div className="admin-timeline-dot" />
                                                    <div className="admin-timeline-content">
                                                        <strong>{entry.status}</strong>
                                                        <p>{formatDate(entry.time)}</p>
                                                        <span>Changed by: {entry.changedBy || "-"}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>-</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="admin-empty-detail">
                                <ShoppingCart size={28} />
                                <h3>Select an order</h3>
                                <p>Choose an order from the table to inspect checkout, payment, pickup, and dispute details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
