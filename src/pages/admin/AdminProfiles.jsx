import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, UserRound, Building2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminProfiles.css";

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function AdminProfiles() {
    const [activeTab, setActiveTab] = useState("PERSONAL");

    const [personalProfiles, setPersonalProfiles] = useState([]);
    const [businessProfiles, setBusinessProfiles] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [businessTypeFilter, setBusinessTypeFilter] = useState("");
    const [verifiedFilter, setVerifiedFilter] = useState("");

    const [selectedProfile, setSelectedProfile] = useState(null);

    useEffect(() => {
        loadProfiles();
    }, []);

    async function loadProfiles() {
        try {
            setLoading(true);
            setError("");

            const [personalData, businessData] = await Promise.all([
                adminService.getAllPersonalProfiles(),
                adminService.getAllBusinessProfiles(),
            ]);

            setPersonalProfiles(personalData || []);
            setBusinessProfiles(businessData || []);
        } catch (err) {
            setError(err.message || "Failed to load profiles.");
        } finally {
            setLoading(false);
        }
    }

    const filteredPersonalProfiles = useMemo(() => {
        return personalProfiles.filter((item) => {
            const q = searchTerm.trim().toLowerCase();

            return (
                !q ||
                item.userId?.toLowerCase().includes(q) ||
                item.firstName?.toLowerCase().includes(q) ||
                item.lastName?.toLowerCase().includes(q) ||
                item.displayName?.toLowerCase().includes(q) ||
                item.username?.toLowerCase().includes(q) ||
                item.email?.toLowerCase().includes(q)
            );
        });
    }, [personalProfiles, searchTerm]);

    const filteredBusinessProfiles = useMemo(() => {
        return businessProfiles.filter((item) => {
            const q = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !q ||
                item.userId?.toLowerCase().includes(q) ||
                item.businessName?.toLowerCase().includes(q) ||
                item.address?.toLowerCase().includes(q) ||
                item.email?.toLowerCase().includes(q) ||
                String(item.businessType || "").toLowerCase().includes(q);

            const matchesType = !businessTypeFilter || item.businessType === businessTypeFilter;

            const matchesVerified =
                verifiedFilter === ""
                    ? true
                    : String(item.verified) === verifiedFilter;

            return matchesSearch && matchesType && matchesVerified;
        });
    }, [businessProfiles, searchTerm, businessTypeFilter, verifiedFilter]);

    async function toggleVerified(userId, verified) {
        try {
            const updated = await adminService.setBusinessVerified(userId, verified);
            setBusinessProfiles((prev) =>
                prev.map((item) => (item.userId === userId ? updated : item))
            );

            if (selectedProfile?.userId === userId) {
                setSelectedProfile(updated);
            }
        } catch (err) {
            alert(err.message || "Failed to update verification status.");
        }
    }

    async function verifyUser(userId) {
        try {
            await adminService.verifyUser(userId);
            await loadProfiles();
        } catch (err) {
            alert(err.message || "Failed to verify user.");
        }
    }

    async function deletePersonalProfile(userId) {
        const confirmed = window.confirm("Delete this personal profile?");
        if (!confirmed) return;

        try {
            await adminService.deletePersonalProfile(userId);
            setPersonalProfiles((prev) => prev.filter((item) => item.userId !== userId));
            if (selectedProfile?.userId === userId) {
                setSelectedProfile(null);
            }
        } catch (err) {
            alert(err.message || "Failed to delete personal profile.");
        }
    }

    async function deleteBusinessProfile(userId) {
        const confirmed = window.confirm("Delete this business profile?");
        if (!confirmed) return;

        try {
            await adminService.deleteBusinessProfile(userId);
            setBusinessProfiles((prev) => prev.filter((item) => item.userId !== userId));
            if (selectedProfile?.userId === userId) {
                setSelectedProfile(null);
            }
        } catch (err) {
            alert(err.message || "Failed to delete business profile.");
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading profiles...</h2>
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
                        <h1>Profiles</h1>
                        <p>Manage personal and business profiles across the platform.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadProfiles}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-profile-tabs">
                    <button
                        className={activeTab === "PERSONAL" ? "active" : ""}
                        onClick={() => {
                            setActiveTab("PERSONAL");
                            setSelectedProfile(null);
                        }}
                    >
                        Personal Profiles
                    </button>
                    <button
                        className={activeTab === "BUSINESS" ? "active" : ""}
                        onClick={() => {
                            setActiveTab("BUSINESS");
                            setSelectedProfile(null);
                        }}
                    >
                        Business Profiles
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={
                                activeTab === "PERSONAL"
                                    ? "Search by user id, name, username or email"
                                    : "Search by user id, business name, address, type or email"
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {activeTab === "BUSINESS" && (
                        <>
                            <select
                                value={businessTypeFilter}
                                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="FARMER">FARMER</option>
                                <option value="RESTAURANT">RESTAURANT</option>
                                <option value="NGO">NGO</option>
                            </select>

                            <select
                                value={verifiedFilter}
                                onChange={(e) => setVerifiedFilter(e.target.value)}
                            >
                                <option value="">All Verification States</option>
                                <option value="true">Verified</option>
                                <option value="false">Not Verified</option>
                            </select>
                        </>
                    )}
                </div>

                <div className="admin-listings-grid">
                    <div className="admin-listings-table-panel">
                        <div className="admin-users-table-wrap">
                            {activeTab === "PERSONAL" ? (
                                <table className="admin-users-table">
                                    <thead>
                                    <tr>
                                        <th>Profile</th>
                                        <th>Role</th>
                                        <th>Location</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredPersonalProfiles.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="admin-empty-row">
                                                No personal profiles found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPersonalProfiles.map((item) => (
                                            <tr key={item.userId}>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-user-avatar">
                                                            <UserRound size={16} />
                                                        </div>
                                                        <div>
                                                            <strong>
                                                                {item.displayName ||
                                                                    `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
                                                                    item.username ||
                                                                    "Unnamed Profile"}
                                                            </strong>
                                                            <p>{item.email || "No email"}</p>
                                                            <span>{item.userId}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>{item.role || "—"}</td>
                                                <td>{item.location || "—"}</td>
                                                <td>{formatDate(item.createdAt)}</td>

                                                <td>
                                                    <div className="admin-actions">
                                                        <button
                                                            className="admin-btn"
                                                            onClick={() => setSelectedProfile(item)}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="admin-btn admin-btn-danger"
                                                            onClick={() => deletePersonalProfile(item.userId)}
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
                            ) : (
                                <table className="admin-users-table">
                                    <thead>
                                    <tr>
                                        <th>Business</th>
                                        <th>Type</th>
                                        <th>Verified</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredBusinessProfiles.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="admin-empty-row">
                                                No business profiles found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBusinessProfiles.map((item) => (
                                            <tr key={item.userId}>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-user-avatar">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <div>
                                                            <strong>{item.businessName || "Unnamed Business"}</strong>
                                                            <p>{item.email || "No email"}</p>
                                                            <span>{item.userId}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>{item.businessType || "—"}</td>

                                                <td>
                                                        <span
                                                            className={`admin-badge ${
                                                                item.verified
                                                                    ? "admin-badge-approved"
                                                                    : "admin-badge-rejected"
                                                            }`}
                                                        >
                                                            {item.verified ? "VERIFIED" : "NOT VERIFIED"}
                                                        </span>
                                                </td>

                                                <td>{formatDate(item.createdAt)}</td>

                                                <td>
                                                    <div className="admin-actions">
                                                        <button
                                                            className="admin-btn"
                                                            onClick={() => setSelectedProfile(item)}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="admin-btn"
                                                            onClick={() =>
                                                                toggleVerified(item.userId, !item.verified)
                                                            }
                                                        >
                                                            {item.verified ? "Unverify" : "Verify"}
                                                        </button>
                                                        <button
                                                            className="admin-btn admin-btn-danger"
                                                            onClick={() => deleteBusinessProfile(item.userId)}
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
                            )}
                        </div>
                    </div>

                    <div className="admin-listing-detail-panel">
                        {selectedProfile ? (
                            activeTab === "PERSONAL" ? (
                                <>
                                    <div className="admin-detail-header">
                                        <h2>Personal Profile</h2>
                                        <button className="admin-btn" onClick={() => setSelectedProfile(null)}>
                                            Close
                                        </button>
                                    </div>

                                    <div className="admin-detail-grid">
                                        <div className="admin-detail-group">
                                            <label>User ID</label>
                                            <p>{selectedProfile.userId || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Display Name</label>
                                            <p>{selectedProfile.displayName || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>First Name</label>
                                            <p>{selectedProfile.firstName || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Last Name</label>
                                            <p>{selectedProfile.lastName || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Username</label>
                                            <p>{selectedProfile.username || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Email</label>
                                            <p>{selectedProfile.email || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Phone</label>
                                            <p>{selectedProfile.phone || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Role</label>
                                            <p>{selectedProfile.role || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Location</label>
                                            <p>{selectedProfile.location || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Created</label>
                                            <p>{formatDate(selectedProfile.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>About</label>
                                        <p>{selectedProfile.about || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Addresses</label>
                                        {(selectedProfile.addresses || []).length > 0 ? (
                                            <ul className="admin-simple-list">
                                                {selectedProfile.addresses.map((address, idx) => (
                                                    <li key={`${address}-${idx}`}>{address}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>—</p>
                                        )}
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Preferences</label>
                                        <div className="admin-roles-wrap">
                                            {(selectedProfile.preferences || []).length > 0 ? (
                                                selectedProfile.preferences.map((pref) => (
                                                    <span key={pref} className="admin-role-pill">
                                                        {pref}
                                                    </span>
                                                ))
                                            ) : (
                                                <p>—</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Stats</label>
                                        <div className="admin-detail-grid">
                                            <div className="admin-detail-group">
                                                <label>Reviews</label>
                                                <p>{selectedProfile.stats?.reviews ?? 0}</p>
                                            </div>
                                            <div className="admin-detail-group">
                                                <label>Purchases</label>
                                                <p>{selectedProfile.stats?.purchases ?? 0}</p>
                                            </div>
                                            <div className="admin-detail-group">
                                                <label>Following</label>
                                                <p>{selectedProfile.stats?.following ?? 0}</p>
                                            </div>
                                            <div className="admin-detail-group">
                                                <label>Followers</label>
                                                <p>{selectedProfile.stats?.followers ?? 0}</p>
                                            </div>
                                            <div className="admin-detail-group">
                                                <label>Average Rating</label>
                                                <p>{selectedProfile.stats?.avgRating ?? 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="admin-detail-header">
                                        <h2>Business Profile</h2>
                                        <button className="admin-btn" onClick={() => setSelectedProfile(null)}>
                                            Close
                                        </button>
                                    </div>

                                    <div className="admin-detail-grid">
                                        <div className="admin-detail-group">
                                            <label>User ID</label>
                                            <p>{selectedProfile.userId || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Business Name</label>
                                            <p>{selectedProfile.businessName || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Type</label>
                                            <p>{selectedProfile.businessType || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Email</label>
                                            <p>{selectedProfile.email || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Address</label>
                                            <p>{selectedProfile.address || "—"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Verified</label>
                                            <p>{selectedProfile.verified ? "Yes" : "No"}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Created</label>
                                            <p>{formatDate(selectedProfile.createdAt)}</p>
                                        </div>
                                        <div className="admin-detail-group">
                                            <label>Updated</label>
                                            <p>{formatDate(selectedProfile.updatedAt)}</p>
                                        </div>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Hours</label>
                                        <p>{selectedProfile.hours || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Description</label>
                                        <p>{selectedProfile.description || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Service Area</label>
                                        <p>{selectedProfile.serviceArea || "—"}</p>
                                    </div>

                                    <div className="admin-detail-group">
                                        <label>Eligibility Notes</label>
                                        <p>{selectedProfile.eligibilityNotes || "—"}</p>
                                    </div>

                                    <div className="admin-actions">
                                        <button
                                            className="admin-btn admin-btn-primary"
                                            onClick={() => verifyUser(selectedProfile.userId)}
                                        >
                                            Verify User
                                        </button>

                                        <button
                                            className="admin-btn"
                                            onClick={() =>
                                                toggleVerified(
                                                    selectedProfile.userId,
                                                    !selectedProfile.verified
                                                )
                                            }
                                        >
                                            {selectedProfile.verified ? "Set Not Verified" : "Set Verified"}
                                        </button>
                                    </div>
                                </>
                            )
                        ) : (
                            <div className="admin-empty-detail">
                                {activeTab === "PERSONAL" ? <UserRound size={28} /> : <Building2 size={28} />}
                                <h3>Select a profile</h3>
                                <p>Choose a profile from the table to inspect its full details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}