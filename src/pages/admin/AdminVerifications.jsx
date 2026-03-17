import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, FileCheck2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminVerifications.css";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"];

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function AdminVerifications() {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [reviewingId, setReviewingId] = useState(null);
    const [reviewForm, setReviewForm] = useState({
        status: "APPROVED",
        adminNotes: "",
    });

    useEffect(() => {
        loadVerifications();
    }, []);

    async function loadVerifications() {
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getAllVerifications();
            setVerifications(data || []);
        } catch (err) {
            setError(err.message || "Failed to load verifications.");
        } finally {
            setLoading(false);
        }
    }

    const filteredVerifications = useMemo(() => {
        return verifications.filter((item) => {
            const q = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !q ||
                item.userId?.toLowerCase().includes(q) ||
                item.type?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q) ||
                item.id?.toLowerCase().includes(q);

            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [verifications, searchTerm, statusFilter]);

    function startReview(item) {
        setReviewingId(item.id);
        setReviewForm({
            status: item.status === "PENDING" ? "APPROVED" : item.status || "APPROVED",
            adminNotes: item.adminNotes || "",
        });
    }

    function cancelReview() {
        setReviewingId(null);
        setReviewForm({
            status: "APPROVED",
            adminNotes: "",
        });
    }

    async function submitReview(id) {
        try {
            const updated = await adminService.reviewVerification(id, reviewForm);
            setVerifications((prev) => prev.map((item) => (item.id === id ? updated : item)));
            cancelReview();
        } catch (err) {
            alert(err.message || "Failed to review verification.");
        }
    }

    async function deleteVerification(id) {
        const confirmed = window.confirm("Delete this verification request?");
        if (!confirmed) return;

        try {
            await adminService.deleteVerification(id);
            setVerifications((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            alert(err.message || "Failed to delete verification.");
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading verifications...</h2>
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
                        <h1>Verification Requests</h1>
                        <p>Review, approve, reject, and manage uploaded business verification requests.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadVerifications}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by user id, type, status or request id"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="admin-users-table-wrap">
                    <table className="admin-users-table">
                        <thead>
                        <tr>
                            <th>Request</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Document</th>
                            <th>Admin Notes</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredVerifications.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="admin-empty-row">
                                    No verification requests found.
                                </td>
                            </tr>
                        ) : (
                            filteredVerifications.map((item) => {
                                const isReviewing = reviewingId === item.id;

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="admin-user-cell">
                                                <div className="admin-user-avatar">
                                                    <FileCheck2 size={16} />
                                                </div>
                                                <div>
                                                    <strong>{item.userId}</strong>
                                                    <p>{item.id}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{item.type || "—"}</td>

                                        <td>
                                                <span className={`admin-badge admin-badge-${String(item.status || "").toLowerCase()}`}>
                                                    {item.status}
                                                </span>
                                        </td>

                                        <td>
                                            {item.documentUrl ? (
                                                <a
                                                    href={item.documentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="admin-link"
                                                >
                                                    Open document
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </td>

                                        <td style={{ minWidth: 220 }}>
                                            {isReviewing ? (
                                                <div className="admin-review-box">
                                                    <select
                                                        value={reviewForm.status}
                                                        onChange={(e) =>
                                                            setReviewForm((prev) => ({
                                                                ...prev,
                                                                status: e.target.value,
                                                            }))
                                                        }
                                                    >
                                                        <option value="APPROVED">APPROVED</option>
                                                        <option value="REJECTED">REJECTED</option>
                                                        <option value="PENDING">PENDING</option>
                                                    </select>

                                                    <textarea
                                                        rows="4"
                                                        placeholder="Admin notes"
                                                        value={reviewForm.adminNotes}
                                                        onChange={(e) =>
                                                            setReviewForm((prev) => ({
                                                                ...prev,
                                                                adminNotes: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                item.adminNotes || "—"
                                            )}
                                        </td>

                                        <td>{formatDate(item.createdAt)}</td>

                                        <td>
                                            <div className="admin-actions">
                                                {isReviewing ? (
                                                    <>
                                                        <button
                                                            className="admin-btn admin-btn-primary"
                                                            onClick={() => submitReview(item.id)}
                                                        >
                                                            Save Review
                                                        </button>
                                                        <button className="admin-btn" onClick={cancelReview}>
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="admin-btn"
                                                            onClick={() => startReview(item)}
                                                        >
                                                            Review
                                                        </button>
                                                        <button
                                                            className="admin-btn admin-btn-danger"
                                                            onClick={() => deleteVerification(item.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}