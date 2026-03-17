import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, ShoppingCart } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminOrders.css";

const ORDER_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "READY_FOR_PICKUP",
    "COMPLETED",
    "CANCELLED",
];

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

function formatPrice(value) {
    if (value == null) return "—";
    return `$${Number(value).toFixed(2)}`;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

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

    const filteredOrders = useMemo(() => {
        return orders.filter((item) => {
            const q = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !q ||
                item.id?.toLowerCase().includes(q) ||
                item.shopperId?.toLowerCase().includes(q) ||
                item.restaurantId?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q);

            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    async function updateStatus(orderId, status) {
        try {
            const updated = await adminService.updateOrderStatus(orderId, status);
            setOrders((prev) => prev.map((item) => (item.id === orderId ? updated : item)));
            if (selectedOrder?.id === orderId) setSelectedOrder(updated);
        } catch (err) {
            alert(err.message || "Failed to update order status.");
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
                        <p>Track all orders, update their status, and inspect status history.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadOrders}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by order id, shopper id, restaurant id or status"
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
                                    <th>Order Date</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="admin-empty-row">
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
                                                        <p>Shopper: {item.shopperId || "—"}</p>
                                                        <span>Restaurant: {item.restaurantId || "—"}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{formatPrice(item.totalPrice)}</td>
                                            <td>{item.items?.length ?? 0}</td>

                                            <td>
                                                <select
                                                    className="admin-status-select"
                                                    value={item.status || "PENDING"}
                                                    onChange={(e) => updateStatus(item.id, e.target.value)}
                                                >
                                                    {ORDER_STATUSES.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>{formatDate(item.orderDate)}</td>

                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        className="admin-btn"
                                                        onClick={() => setSelectedOrder(item)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-danger"
                                                        onClick={() => deleteOrder(item.id)}
                                                    >
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
                                        <label>Shopper ID</label>
                                        <p>{selectedOrder.shopperId || "—"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Restaurant ID</label>
                                        <p>{selectedOrder.restaurantId || "—"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Total Price</label>
                                        <p>{formatPrice(selectedOrder.totalPrice)}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Status</label>
                                        <p>{selectedOrder.status || "—"}</p>
                                    </div>
                                    <div className="admin-detail-group">
                                        <label>Order Date</label>
                                        <p>{formatDate(selectedOrder.orderDate)}</p>
                                    </div>
                                </div>

                                <div className="admin-detail-group">
                                    <label>Items</label>
                                    {(selectedOrder.items || []).length > 0 ? (
                                        <ul className="admin-simple-list">
                                            {selectedOrder.items.map((itemId) => (
                                                <li key={itemId}>{itemId}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>—</p>
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
                                                        <span>Changed by: {entry.changedBy || "—"}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>—</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="admin-empty-detail">
                                <ShoppingCart size={28} />
                                <h3>Select an order</h3>
                                <p>Choose an order from the table to inspect the full order details and history.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}