import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, CalendarClock } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminReservations.css";

const RESERVATION_STATUSES = ["RESERVED", "PICKED_UP", "CANCELLED"];

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function AdminReservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [selectedReservation, setSelectedReservation] = useState(null);

    useEffect(() => {
        loadReservations();
    }, []);

    async function loadReservations() {
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getAllReservations();
            setReservations(data || []);
        } catch (err) {
            setError(err.message || "Failed to load reservations.");
        } finally {
            setLoading(false);
        }
    }

    const filteredReservations = useMemo(() => {
        return reservations.filter((item) => {
            const q = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !q ||
                item.id?.toLowerCase().includes(q) ||
                item.ngoId?.toLowerCase().includes(q) ||
                item.restaurantId?.toLowerCase().includes(q) ||
                item.surplusItemId?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q);

            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [reservations, searchTerm, statusFilter]);

    async function updateStatus(id, status) {
        try {
            const updated = await adminService.updateReservationStatus(id, status);
            setReservations((prev) => prev.map((item) => (item.id === id ? updated : item)));
            if (selectedReservation?.id === id) {
                setSelectedReservation(updated);
            }
        } catch (err) {
            alert(err.message || "Failed to update reservation status.");
        }
    }

    async function deleteReservation(id) {
        const confirmed = window.confirm("Delete this reservation?");
        if (!confirmed) return;

        try {
            await adminService.deleteReservation(id);
            setReservations((prev) => prev.filter((item) => item.id !== id));
            if (selectedReservation?.id === id) {
                setSelectedReservation(null);
            }
        } catch (err) {
            alert(err.message || "Failed to delete reservation.");
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading reservations...</h2>
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
                        <h1>Reservations</h1>
                        <p>Manage NGO reservations, inspect details, and update reservation status.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadReservations}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by reservation id, NGO id, restaurant id, item id or status"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {RESERVATION_STATUSES.map((status) => (
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
                                    <th>Reservation</th>
                                    <th>NGO</th>
                                    <th>Restaurant</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredReservations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="admin-empty-row">
                                            No reservations found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReservations.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-user-avatar">
                                                        <CalendarClock size={16} />
                                                    </div>
                                                    <div>
                                                        <strong>{item.id}</strong>
                                                        <p>Item: {item.surplusItemId || "—"}</p>
                                                        <span>{item.status || "—"}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{item.ngoId || "—"}</td>
                                            <td>{item.restaurantId || "—"}</td>

                                            <td>
                                                <select
                                                    className="admin-status-select"
                                                    value={item.status || "RESERVED"}
                                                    onChange={(e) => updateStatus(item.id, e.target.value)}
                                                >
                                                    {RESERVATION_STATUSES.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>{formatDate(item.reservationTime)}</td>

                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        className="admin-btn"
                                                        onClick={() => setSelectedReservation(item)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-danger"
                                                        onClick={() => deleteReservation(item.id)}
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
                        {selectedReservation ? (
                            <>
                                <div className="admin-detail-header">
                                    <h2>Reservation Details</h2>
                                    <button className="admin-btn" onClick={() => setSelectedReservation(null)}>
                                        Close
                                    </button>
                                </div>

                                <div className="admin-detail-grid">
                                    <div className="admin-detail-group">
                                        <label>Reservation ID</label>
                                        <p>{selectedReservation.id}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>NGO ID</label>
                                        <p>{selectedReservation.ngoId || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Restaurant ID</label>
                                        <p>{selectedReservation.restaurantId || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Surplus Item ID</label>
                                        <p>{selectedReservation.surplusItemId || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Status</label>
                                        <p>{selectedReservation.status || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Reservation Time</label>
                                        <p>{formatDate(selectedReservation.reservationTime)}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="admin-empty-detail">
                                <CalendarClock size={28} />
                                <h3>Select a reservation</h3>
                                <p>Choose a reservation from the table to inspect its full details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}