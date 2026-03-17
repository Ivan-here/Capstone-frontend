import React, { useEffect, useMemo, useState } from "react";
import { Search, Shield, RefreshCw } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminUsers.css";

const ALL_ROLES = ["SHOPPER", "FARMER", "RESTAURANT", "NGO", "ADMIN"];
const ALL_STATUSES = ["ACTIVE", "SUSPENDED"];

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    const [editingUserId, setEditingUserId] = useState(null);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        displayName: "",
        email: "",
        username: "",
        status: "",
    });

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getAllUsers();
            setUsers(data || []);
        } catch (err) {
            setError(err.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const q = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !q ||
                user.email?.toLowerCase().includes(q) ||
                user.username?.toLowerCase().includes(q) ||
                user.displayName?.toLowerCase().includes(q) ||
                user.firstName?.toLowerCase().includes(q) ||
                user.lastName?.toLowerCase().includes(q) ||
                user.id?.toLowerCase().includes(q);

            const matchesStatus = !statusFilter || user.status === statusFilter;

            const matchesRole =
                !roleFilter || (Array.isArray(user.roles) && user.roles.includes(roleFilter));

            return matchesSearch && matchesStatus && matchesRole;
        });
    }, [users, searchTerm, statusFilter, roleFilter]);

    function startEdit(user) {
        setEditingUserId(user.id);
        setEditForm({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            displayName: user.displayName || "",
            email: user.email || "",
            username: user.username || "",
            status: user.status || "ACTIVE",
        });
    }

    function cancelEdit() {
        setEditingUserId(null);
        setEditForm({
            firstName: "",
            lastName: "",
            displayName: "",
            email: "",
            username: "",
            status: "",
        });
    }

    async function saveEdit(userId) {
        try {
            const updated = await adminService.updateUserDetails(userId, editForm);
            setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
            cancelEdit();
        } catch (err) {
            alert(err.message || "Failed to update user.");
        }
    }

    async function changeStatus(userId, status) {
        try {
            const updated = await adminService.updateUserStatus(userId, status);
            setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        } catch (err) {
            alert(err.message || "Failed to update status.");
        }
    }

    async function addRole(userId, role) {
        try {
            const response = await adminService.addUserRole(userId, role);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, roles: Array.from(response.roles || []) } : u
                )
            );
        } catch (err) {
            alert(err.message || "Failed to add role.");
        }
    }

    async function removeRole(userId, role) {
        try {
            const response = await adminService.removeUserRole(userId, role);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, roles: Array.from(response.roles || []) } : u
                )
            );
        } catch (err) {
            alert(err.message || "Failed to remove role.");
        }
    }

    async function deleteUser(userId) {
        const confirmed = window.confirm("Delete this user?");
        if (!confirmed) return;

        try {
            await adminService.deleteUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (err) {
            alert(err.message || "Failed to delete user.");
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading users...</h2>
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
                <div className="admin-users-header">
                    <div>
                        <h1>User Management</h1>
                        <p>Search, edit, suspend, delete, and manage user roles.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadUsers}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, username or id"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {ALL_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        {ALL_ROLES.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="admin-users-table-wrap">
                    <table className="admin-users-table">
                        <thead>
                        <tr>
                            <th>User</th>
                            <th>Roles</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="admin-empty-row">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => {
                                const isEditing = editingUserId === user.id;

                                return (
                                    <tr key={user.id}>
                                        <td>
                                            {isEditing ? (
                                                <div className="admin-edit-grid">
                                                    <input
                                                        value={editForm.firstName}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                firstName: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="First name"
                                                    />
                                                    <input
                                                        value={editForm.lastName}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                lastName: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Last name"
                                                    />
                                                    <input
                                                        value={editForm.displayName}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                displayName: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Display name"
                                                    />
                                                    <input
                                                        value={editForm.email}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                email: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Email"
                                                    />
                                                    <input
                                                        value={editForm.username}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                username: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Username"
                                                    />
                                                    <select
                                                        value={editForm.status}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                status: e.target.value,
                                                            }))
                                                        }
                                                    >
                                                        {ALL_STATUSES.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="admin-user-cell">
                                                    <div className="admin-user-avatar">
                                                        <Shield size={16} />
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            {user.displayName ||
                                                                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                                user.username ||
                                                                "Unnamed User"}
                                                        </strong>
                                                        <p>{user.email || "No email"}</p>
                                                        <span>{user.id}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        <td>
                                            <div className="admin-roles-wrap">
                                                {(user.roles || []).map((role) => (
                                                    <span key={role} className="admin-role-pill">
                                                            {role}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRole(user.id, role)}
                                                        >
                                                                ×
                                                            </button>
                                                        </span>
                                                ))}
                                                <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (!value) return;
                                                        addRole(user.id, value);
                                                        e.target.value = "";
                                                    }}
                                                >
                                                    <option value="">+ Add role</option>
                                                    {ALL_ROLES.filter(
                                                        (role) => !(user.roles || []).includes(role)
                                                    ).map((role) => (
                                                        <option key={role} value={role}>
                                                            {role}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>

                                        <td>
                                            <select
                                                className={`admin-status-select admin-status-${String(user.status || "").toLowerCase()}`}
                                                value={user.status || "ACTIVE"}
                                                onChange={(e) => changeStatus(user.id, e.target.value)}
                                            >
                                                {ALL_STATUSES.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>{formatDate(user.createdAt)}</td>

                                        <td>
                                            <div className="admin-actions">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            className="admin-btn admin-btn-primary"
                                                            onClick={() => saveEdit(user.id)}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="admin-btn"
                                                            onClick={cancelEdit}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="admin-btn"
                                                            onClick={() => startEdit(user)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="admin-btn admin-btn-danger"
                                                            onClick={() => deleteUser(user.id)}
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