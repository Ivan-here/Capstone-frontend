import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, FileCheck2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminVerifications.css";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const ROLES = ["FARMER", "RESTAURANT", "NGO"];

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function AdminVerifications() {
    const [verifications, setVerifications] = useState([]);
    const [usersById, setUsersById] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [reviewingId, setReviewingId] = useState(null);
    const [reviewForm, setReviewForm] = useState({
        status: "APPROVED",
        adminNotes: "",
        selectedRole: "",
    });

    const [savingReview, setSavingReview] = useState(false);
    const [changingRole, setChangingRole] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [verificationData, usersData] = await Promise.all([
                adminService.getAllVerifications(),
                adminService.getAllUsers(),
            ]);

            setVerifications(verificationData || []);

            const mappedUsers = {};
            (usersData || []).forEach((user) => {
                mappedUsers[user.id] = user;
            });
            setUsersById(mappedUsers);
        } catch (err) {
            setError(err.message || "Failed to load verifications.");
        } finally {
            setLoading(false);
        }
    }

    const filteredVerifications = useMemo(() => {
        return verifications.filter((item) => {
            const q = searchTerm.trim().toLowerCase();
            const user = usersById[item.userId];
            const currentRoles = Array.isArray(user?.roles) ? user.roles.join(" ") : "";

            const matchesSearch =
                !q ||
                item.userId?.toLowerCase().includes(q) ||
                item.type?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q) ||
                item.id?.toLowerCase().includes(q) ||
                currentRoles.toLowerCase().includes(q) ||
                user?.email?.toLowerCase().includes(q) ||
                user?.username?.toLowerCase().includes(q);

            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [verifications, usersById, searchTerm, statusFilter]);

    function getUserRoles(userId) {
        const roles = usersById[userId]?.roles;
        return Array.isArray(roles) ? roles : [];
    }

    function normalizeRole(role) {
        return String(role).toUpperCase().replace(/^ROLE_/, "").trim();
    }

    function startReview(item) {
        setReviewingId(item.id);
        setReviewForm({
            status: item.status === "PENDING" ? "APPROVED" : item.status || "APPROVED",
            adminNotes: item.adminNotes || "",
            selectedRole: item.type || "",
        });
    }

    function cancelReview() {
        setReviewingId(null);
        setReviewForm({
            status: "APPROVED",
            adminNotes: "",
            selectedRole: "",
        });
        setChangingRole("");
    }

    async function handleRemoveRole(userId, role) {
        const confirmed = window.confirm(`Remove role "${role}" from this user?`);
        if (!confirmed) return;

        try {
            setChangingRole(`${userId}-${role}`);

            const response = await adminService.removeUserRole(userId, role);

            setUsersById((prev) => ({
                ...prev,
                [userId]: {
                    ...(prev[userId] || { id: userId }),
                    ...prev[userId],
                    roles: Array.from(response.roles || []),
                },
            }));
        } catch (err) {
            alert(err.message || "Failed to remove role.");
        } finally {
            setChangingRole("");
        }
    }

    async function handleAddRole(userId, role) {
        try {
            setChangingRole(`${userId}-${role}-add`);

            const response = await adminService.addUserRole(userId, role);

            setUsersById((prev) => ({
                ...prev,
                [userId]: {
                    ...(prev[userId] || { id: userId }),
                    ...prev[userId],
                    roles: Array.from(response.roles || []),
                },
            }));
        } catch (err) {
            alert(err.message || "Failed to add role.");
        } finally {
            setChangingRole("");
        }
    }

    async function submitReview(item) {
        try {
            setSavingReview(true);

            const payload = {
                status: reviewForm.status,
                adminNotes: reviewForm.adminNotes,
            };

            if (reviewForm.status === "APPROVED") {
                if (!reviewForm.selectedRole) {
                    alert("Please select a role before approving.");
                    return;
                }

                const currentRoles = getUserRoles(item.userId).map(normalizeRole);

                if (!currentRoles.includes(normalizeRole(reviewForm.selectedRole))) {
                    await handleAddRole(item.userId, reviewForm.selectedRole);
                }

                await adminService.verifyUser(item.userId);
            }

            const updated = await adminService.reviewVerification(item.id, payload);

            setVerifications((prev) =>
                prev.map((verification) =>
                    verification.id === item.id ? updated : verification
                )
            );

            cancelReview();
        } catch (err) {
            alert(err.message || "Failed to review verification.");
        } finally {
            setSavingReview(false);
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

                    <button className="admin-refresh-btn" onClick={loadData}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by user id, username, email, requested type, current role, status or request id"
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
                            <th>Requested Type</th>
                            <th>Current Roles</th>
                            <th>Status</th>
                            <th>Document</th>
                            <th>Review</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filteredVerifications.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="admin-empty-row">
                                    No verification requests found.
                                </td>
                            </tr>
                        ) : (
                            filteredVerifications.map((item) => {
                                const isReviewing = reviewingId === item.id;
                                const user = usersById[item.userId];
                                const currentRoles = getUserRoles(item.userId);

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="admin-user-cell">
                                                <div className="admin-user-avatar">
                                                    <FileCheck2 size={16} />
                                                </div>
                                                <div>
                                                    <strong>{user?.displayName || user?.username || item.userId}</strong>
                                                    <p>{user?.email || item.userId}</p>
                                                    <span>{item.id}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{item.type || "—"}</td>

                                        <td>
                                            <div className="admin-roles-wrap">
                                                {currentRoles.length > 0 ? (
                                                    currentRoles.map((role) => (
                                                        <span key={role} className="admin-role-pill">
                                                                {role}
                                                            </span>
                                                    ))
                                                ) : (
                                                    <span style={{ color: "#777" }}>No roles</span>
                                                )}
                                            </div>
                                        </td>

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

                                        <td style={{ minWidth: 360 }}>
                                            {isReviewing ? (
                                                <div className="admin-review-box">
                                                    <div className="admin-role-management-box">
                                                        <label>Role Management</label>

                                                        <div className="admin-role-management-note">
                                                            Removing a role here updates the user immediately and does not affect this verification request.
                                                        </div>

                                                        <div className="admin-roles-wrap">
                                                            {currentRoles.length > 0 ? (
                                                                currentRoles.map((role) => (
                                                                    <span key={role} className="admin-role-pill admin-role-pill-removable">
                                                                    {role}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveRole(item.userId, role)}
                                                                            disabled={changingRole === `${item.userId}-${role}`}
                                                                            title={`Remove ${role}`}
                                                                        >
                                                                        ×
                                                                        </button>
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span style={{ color: "#777" }}>No roles</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="admin-review-divider" />

                                                    <div className="admin-verification-review-box">
                                                        <label>Verification Review</label>

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

                                                        <select
                                                            value={reviewForm.selectedRole}
                                                            onChange={(e) =>
                                                                setReviewForm((prev) => ({
                                                                    ...prev,
                                                                    selectedRole: e.target.value,
                                                                }))
                                                            }
                                                            disabled={reviewForm.status !== "APPROVED"}
                                                        >
                                                            <option value="">Select role to grant on approval</option>
                                                            {ROLES.map((role) => (
                                                                <option key={role} value={role}>
                                                                    {role}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {reviewForm.status === "APPROVED" && reviewForm.selectedRole && (
                                                            <div className="admin-review-role-preview">
                                                                On approval, this role will be granted: <strong>{reviewForm.selectedRole}</strong>
                                                            </div>
                                                        )}

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
                                                </div>
                                            ) : (
                                                <div>
                                                    <div>{item.adminNotes || "—"}</div>
                                                    <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#666" }}>
                                                        Requested role: {item.type || "—"}
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        <td>{formatDate(item.createdAt)}</td>

                                        <td>
                                            <div className="admin-actions">
                                                {isReviewing ? (
                                                    <>
                                                        <button
                                                            className="admin-btn admin-btn-primary"
                                                            onClick={() => submitReview(item)}
                                                            disabled={savingReview}
                                                        >
                                                            {savingReview ? "Saving..." : "Save Review"}
                                                        </button>
                                                        <button
                                                            className="admin-btn"
                                                            onClick={cancelReview}
                                                            disabled={savingReview}
                                                        >
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