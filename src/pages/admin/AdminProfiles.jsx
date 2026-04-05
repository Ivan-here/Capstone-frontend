import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, UserRound, Building2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminProfiles.css";

const ROLES = ["FARMER", "RESTAURANT", "NGO"];

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

function normalizeRole(role) {
    return String(role || "").toUpperCase().replace(/^ROLE_/, "").trim();
}

function latestVerificationMap(items) {
    const map = {};
    for (const item of items || []) {
        if (!item?.userId) continue;
        const nextTime = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        const prevTime = map[item.userId]?.createdAt ? new Date(map[item.userId].createdAt).getTime() : 0;
        if (!map[item.userId] || nextTime >= prevTime) map[item.userId] = item;
    }
    return map;
}

export default function AdminProfiles() {
    const [activeTab, setActiveTab] = useState("PERSONAL");
    const [personalProfiles, setPersonalProfiles] = useState([]);
    const [businessProfiles, setBusinessProfiles] = useState([]);
    const [usersById, setUsersById] = useState({});
    const [verificationByUser, setVerificationByUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [businessTypeFilter, setBusinessTypeFilter] = useState("");
    const [verifiedFilter, setVerifiedFilter] = useState("");
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [reviewState, setReviewState] = useState(null);
    const [reviewForm, setReviewForm] = useState({ status: "APPROVED", adminNotes: "", selectedRole: "" });
    const [savingReview, setSavingReview] = useState(false);
    const [changingRole, setChangingRole] = useState("");

    useEffect(() => {
        loadProfiles();
    }, []);

    async function loadProfiles() {
        const selectedUserId = selectedProfile?.userId;
        try {
            setLoading(true);
            setError("");
            const [personalData, businessData, usersData, verificationData] = await Promise.all([
                adminService.getAllPersonalProfiles(),
                adminService.getAllBusinessProfiles(),
                adminService.getAllUsers(),
                adminService.getAllVerifications(),
            ]);

            const personal = personalData || [];
            const business = businessData || [];
            setPersonalProfiles(personal);
            setBusinessProfiles(business);

            const nextUsersById = {};
            for (const user of usersData || []) nextUsersById[user.id] = user;
            setUsersById(nextUsersById);
            setVerificationByUser(latestVerificationMap(verificationData || []));

            if (selectedUserId) {
                const nextSelected = (activeTab === "PERSONAL" ? personal : business).find((item) => item.userId === selectedUserId) || null;
                setSelectedProfile(nextSelected);
            }
        } catch (err) {
            setError(err.message || "Failed to load profiles.");
        } finally {
            setLoading(false);
        }
    }

    const filteredPersonalProfiles = useMemo(() => personalProfiles.filter((item) => {
        const q = searchTerm.trim().toLowerCase();
        return !q
            || item.userId?.toLowerCase().includes(q)
            || item.firstName?.toLowerCase().includes(q)
            || item.lastName?.toLowerCase().includes(q)
            || item.displayName?.toLowerCase().includes(q)
            || item.username?.toLowerCase().includes(q)
            || item.email?.toLowerCase().includes(q);
    }), [personalProfiles, searchTerm]);

    const filteredBusinessProfiles = useMemo(() => businessProfiles.filter((item) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = !q
            || item.userId?.toLowerCase().includes(q)
            || item.businessName?.toLowerCase().includes(q)
            || item.address?.toLowerCase().includes(q)
            || item.email?.toLowerCase().includes(q)
            || String(item.businessType || "").toLowerCase().includes(q);
        const matchesType = !businessTypeFilter || item.businessType === businessTypeFilter;
        const matchesVerified = verifiedFilter === "" || String(item.verified) === verifiedFilter;
        return matchesSearch && matchesType && matchesVerified;
    }), [businessProfiles, searchTerm, businessTypeFilter, verifiedFilter]);

    const selectedVerification = activeTab === "BUSINESS" && selectedProfile ? verificationByUser[selectedProfile.userId] || null : null;
    const currentRoles = activeTab === "BUSINESS" && selectedProfile && Array.isArray(usersById[selectedProfile.userId]?.roles)
        ? usersById[selectedProfile.userId].roles
        : [];
    const isReviewingSelectedBusiness = reviewState?.userId === selectedProfile?.userId;

    async function refreshBusinessProfile(userId) {
        const refreshed = await adminService.getBusinessProfile(userId);
        setBusinessProfiles((prev) => prev.map((item) => item.userId === userId ? refreshed : item));
        if (selectedProfile?.userId === userId && activeTab === "BUSINESS") setSelectedProfile(refreshed);
    }

    async function toggleVerified(userId, verified) {
        try {
            const updated = await adminService.setBusinessVerified(userId, verified);
            setBusinessProfiles((prev) => prev.map((item) => item.userId === userId ? updated : item));
            if (selectedProfile?.userId === userId) setSelectedProfile(updated);
        } catch (err) {
            alert(err.message || "Failed to update verification status.");
        }
    }

    function startBusinessReview(profile) {
        const verification = verificationByUser[profile.userId];
        if (!verification) return alert("No verification request is available for this business profile.");
        setReviewState({ mode: "verification", userId: profile.userId, verificationId: verification.id, targetVerified: true });
        setReviewForm({
            status: verification.status === "PENDING" ? "APPROVED" : verification.status || "APPROVED",
            adminNotes: verification.adminNotes || "",
            selectedRole: verification.type || profile.businessType || "",
        });
    }

    function startManualVerificationReview(profile, targetVerified) {
        setReviewState({ mode: "manual", userId: profile.userId, targetVerified });
        setReviewForm({
            status: targetVerified ? "APPROVED" : "REJECTED",
            adminNotes: "",
            selectedRole: profile.businessType || "",
        });
    }

    function cancelBusinessReview() {
        setReviewState(null);
        setReviewForm({ status: "APPROVED", adminNotes: "", selectedRole: "" });
        setChangingRole("");
    }

    async function handleRoleChange(userId, role, action) {
        if (action === "remove") {
            const confirmed = window.confirm(`Remove role "${role}" from this user?`);
            if (!confirmed) return false;
        }

        try {
            setChangingRole(`${userId}-${role}-${action}`);
            const response = action === "add"
                ? await adminService.addUserRole(userId, role)
                : await adminService.removeUserRole(userId, role);
            setUsersById((prev) => ({
                ...prev,
                [userId]: { ...(prev[userId] || { id: userId }), ...prev[userId], roles: Array.from(response.roles || []) },
            }));
            return true;
        } catch (err) {
            alert(err.message || `Failed to ${action} role.`);
            return false;
        } finally {
            setChangingRole("");
        }
    }

    async function submitBusinessReview(profile) {
        if (!reviewState) return;
        const verification = verificationByUser[profile.userId];
        if (reviewState.mode === "verification" && !verification) return alert("No verification request is available for this business profile.");
        if (!reviewForm.adminNotes.trim()) return alert("Please provide a reason before saving.");
        if (reviewState.mode === "verification" && reviewForm.status === "APPROVED" && !reviewForm.selectedRole) {
            return alert("Please select a role before approving.");
        }

        try {
            setSavingReview(true);

            if (reviewState.mode === "verification") {
                if (reviewForm.status === "APPROVED") {
                    const normalizedRoles = currentRoles.map(normalizeRole);
                    const selectedRole = normalizeRole(reviewForm.selectedRole);
                    if (!normalizedRoles.includes(selectedRole)) {
                        const added = await handleRoleChange(profile.userId, reviewForm.selectedRole, "add");
                        if (!added) return;
                    }
                    await adminService.verifyUser(profile.userId);
                }

                const updated = await adminService.reviewVerification(verification.id, {
                    status: reviewForm.status,
                    adminNotes: reviewForm.adminNotes.trim(),
                });
                setVerificationByUser((prev) => ({ ...prev, [profile.userId]: updated }));
            } else {
                await adminService.createAdminNote({
                    targetType: "PROFILE",
                    targetId: profile.userId,
                    note: `${reviewState.targetVerified ? "Manual verification" : "Manual unverification"} reason: ${reviewForm.adminNotes.trim()}`,
                });

                if (reviewState.targetVerified) {
                    await adminService.verifyUser(profile.userId);
                } else {
                    await adminService.setBusinessVerified(profile.userId, false);
                }
            }

            await refreshBusinessProfile(profile.userId);
            cancelBusinessReview();
        } catch (err) {
            alert(err.message || "Failed to review verification.");
        } finally {
            setSavingReview(false);
        }
    }

    async function deletePersonalProfile(userId) {
        if (!window.confirm("Delete this personal profile?")) return;
        try {
            await adminService.deletePersonalProfile(userId);
            setPersonalProfiles((prev) => prev.filter((item) => item.userId !== userId));
            if (selectedProfile?.userId === userId) setSelectedProfile(null);
        } catch (err) {
            alert(err.message || "Failed to delete personal profile.");
        }
    }

    async function deleteBusinessProfile(userId) {
        if (!window.confirm("Delete this business profile?")) return;
        try {
            await adminService.deleteBusinessProfile(userId);
            setBusinessProfiles((prev) => prev.filter((item) => item.userId !== userId));
            setVerificationByUser((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
            if (selectedProfile?.userId === userId) setSelectedProfile(null);
        } catch (err) {
            alert(err.message || "Failed to delete business profile.");
        }
    }

    if (loading) return <div className="admin-page"><div className="admin-shell"><h2>Loading profiles...</h2></div></div>;
    if (error) return <div className="admin-page"><div className="admin-shell"><h2>{error}</h2></div></div>;

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
                    <button className={activeTab === "PERSONAL" ? "active" : ""} onClick={() => { setActiveTab("PERSONAL"); setSelectedProfile(null); cancelBusinessReview(); }}>
                        Personal Profiles
                    </button>
                    <button className={activeTab === "BUSINESS" ? "active" : ""} onClick={() => { setActiveTab("BUSINESS"); setSelectedProfile(null); cancelBusinessReview(); }}>
                        Business Profiles
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={activeTab === "PERSONAL"
                                ? "Search by user id, name, username or email"
                                : "Search by user id, business name, address, type or email"}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {activeTab === "BUSINESS" ? (
                        <>
                            <select value={businessTypeFilter} onChange={(e) => setBusinessTypeFilter(e.target.value)}>
                                <option value="">All Types</option>
                                <option value="FARMER">FARMER</option>
                                <option value="RESTAURANT">RESTAURANT</option>
                                <option value="NGO">NGO</option>
                            </select>
                            <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
                                <option value="">All Verification States</option>
                                <option value="true">Verified</option>
                                <option value="false">Not Verified</option>
                            </select>
                        </>
                    ) : null}
                </div>

                <div className="admin-listings-grid">
                    <div className="admin-listings-table-panel">
                        <div className="admin-users-table-wrap">
                            {activeTab === "PERSONAL" ? (
                                <table className="admin-users-table">
                                    <thead><tr><th>Profile</th><th>Role</th><th>Location</th><th>Created</th><th>Actions</th></tr></thead>
                                    <tbody>
                                    {filteredPersonalProfiles.length === 0 ? (
                                        <tr><td colSpan="5" className="admin-empty-row">No personal profiles found.</td></tr>
                                    ) : filteredPersonalProfiles.map((item) => (
                                        <tr key={item.userId}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-user-avatar"><UserRound size={16} /></div>
                                                    <div>
                                                        <strong>{item.displayName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.username || "Unnamed Profile"}</strong>
                                                        <p>{item.email || "No email"}</p>
                                                        <span>{item.userId}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.role || "-"}</td>
                                            <td>{item.location || "-"}</td>
                                            <td>{formatDate(item.createdAt)}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button className="admin-btn" onClick={() => setSelectedProfile(item)}>View</button>
                                                    <button className="admin-btn admin-btn-danger" onClick={() => deletePersonalProfile(item.userId)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="admin-users-table">
                                    <thead><tr><th>Business</th><th>Type</th><th>Verified</th><th>Verification</th><th>Created</th><th>Actions</th></tr></thead>
                                    <tbody>
                                    {filteredBusinessProfiles.length === 0 ? (
                                        <tr><td colSpan="6" className="admin-empty-row">No business profiles found.</td></tr>
                                    ) : filteredBusinessProfiles.map((item) => {
                                        const latest = verificationByUser[item.userId];
                                        return (
                                            <tr key={item.userId}>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-user-avatar"><Building2 size={16} /></div>
                                                        <div>
                                                            <strong>{item.businessName || "Unnamed Business"}</strong>
                                                            <p>{item.email || "No email"}</p>
                                                            <span>{item.userId}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{item.businessType || "-"}</td>
                                                <td><span className={`admin-badge ${item.verified ? "admin-badge-approved" : "admin-badge-rejected"}`}>{item.verified ? "VERIFIED" : "NOT VERIFIED"}</span></td>
                                                <td>{latest ? <span className={`admin-badge admin-badge-${String(latest.status || "").toLowerCase()}`}>{latest.status}</span> : <span className="admin-inline-note">No request</span>}</td>
                                                <td>{formatDate(item.createdAt)}</td>
                                                <td>
                                                    <div className="admin-actions">
                                                        <button className="admin-btn" onClick={() => { setSelectedProfile(item); cancelBusinessReview(); }}>View</button>
                                                        <button className="admin-btn" onClick={() => { setSelectedProfile(item); startManualVerificationReview(item, !item.verified); }}>{item.verified ? "Unverify" : "Verify"}</button>
                                                        <button className="admin-btn admin-btn-danger" onClick={() => deleteBusinessProfile(item.userId)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="admin-listing-detail-panel">
                        {selectedProfile ? (activeTab === "PERSONAL" ? (
                            <PersonalProfileDetail profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
                        ) : (
                            <BusinessProfileDetail
                                profile={selectedProfile}
                                verification={selectedVerification}
                                currentRoles={currentRoles}
                                isReviewing={isReviewingSelectedBusiness}
                                reviewState={reviewState}
                                reviewForm={reviewForm}
                                savingReview={savingReview}
                                changingRole={changingRole}
                                onClose={() => { setSelectedProfile(null); cancelBusinessReview(); }}
                                onToggleVerified={startManualVerificationReview}
                                onStartReview={startBusinessReview}
                                onCancelReview={cancelBusinessReview}
                                onSubmitReview={submitBusinessReview}
                                onReviewFormChange={setReviewForm}
                                onRemoveRole={(userId, role) => handleRoleChange(userId, role, "remove")}
                            />
                        )) : (
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

function PersonalProfileDetail({ profile, onClose }) {
    return (
        <>
            <div className="admin-detail-header">
                <h2>Personal Profile</h2>
                <button className="admin-btn" onClick={onClose}>Close</button>
            </div>

            <div className="admin-detail-grid">
                <DetailItem label="User ID" value={profile.userId} />
                <DetailItem label="Display Name" value={profile.displayName} />
                <DetailItem label="First Name" value={profile.firstName} />
                <DetailItem label="Last Name" value={profile.lastName} />
                <DetailItem label="Username" value={profile.username} />
                <DetailItem label="Email" value={profile.email} />
                <DetailItem label="Phone" value={profile.phone} />
                <DetailItem label="Role" value={profile.role} />
                <DetailItem label="Location" value={profile.location} />
                <DetailItem label="Created" value={formatDate(profile.createdAt)} />
            </div>

            <DetailItem label="About" value={profile.about} block />

            <div className="admin-detail-group">
                <label>Addresses</label>
                {(profile.addresses || []).length > 0 ? (
                    <ul className="admin-simple-list">
                        {profile.addresses.map((address, idx) => <li key={`${address}-${idx}`}>{address}</li>)}
                    </ul>
                ) : <p>-</p>}
            </div>

            <div className="admin-detail-group">
                <label>Preferences</label>
                <div className="admin-roles-wrap">
                    {(profile.preferences || []).length > 0 ? (
                        profile.preferences.map((pref) => <span key={pref} className="admin-role-pill">{pref}</span>)
                    ) : <p>-</p>}
                </div>
            </div>

            <div className="admin-detail-group">
                <label>Stats</label>
                <div className="admin-detail-grid">
                    <DetailItem label="Reviews" value={profile.stats?.reviews ?? 0} />
                    <DetailItem label="Purchases" value={profile.stats?.purchases ?? 0} />
                    <DetailItem label="Following" value={profile.stats?.following ?? 0} />
                    <DetailItem label="Followers" value={profile.stats?.followers ?? 0} />
                    <DetailItem label="Average Rating" value={profile.stats?.avgRating ?? 0} />
                </div>
            </div>
        </>
    );
}

function BusinessProfileDetail(props) {
    const {
        profile,
        verification,
        currentRoles,
        isReviewing,
        reviewState,
        reviewForm,
        savingReview,
        changingRole,
        onClose,
        onToggleVerified,
        onStartReview,
        onCancelReview,
        onSubmitReview,
        onReviewFormChange,
        onRemoveRole,
    } = props;

    return (
        <>
            <div className="admin-detail-header">
                <h2>Business Profile</h2>
                <button className="admin-btn" onClick={onClose}>Close</button>
            </div>

            <div className="admin-detail-grid">
                <DetailItem label="User ID" value={profile.userId} />
                <DetailItem label="Business Name" value={profile.businessName} />
                <DetailItem label="Type" value={profile.businessType} />
                <DetailItem label="Email" value={profile.email} />
                <DetailItem label="Address" value={profile.address} />
                <DetailItem label="Verified" value={profile.verified ? "Yes" : "No"} />
                <DetailItem label="Created" value={formatDate(profile.createdAt)} />
                <DetailItem label="Updated" value={formatDate(profile.updatedAt)} />
            </div>

            <DetailItem label="Hours" value={profile.hours} block />
            <DetailItem label="Description" value={profile.description} block />
            <DetailItem label="Service Area" value={profile.serviceArea} block />
            <DetailItem label="Eligibility Notes" value={profile.eligibilityNotes} block />

            <div className="admin-detail-group">
                <label>Current Roles</label>
                <div className="admin-roles-wrap">
                    {currentRoles.length > 0 ? currentRoles.map((role) => (
                        <span key={role} className="admin-role-pill">{role}</span>
                    )) : <p>-</p>}
                </div>
            </div>

            <div className="admin-detail-actions">
                <button className="admin-btn admin-btn-primary" onClick={() => onStartReview(profile)} disabled={!verification}>
                    {verification ? "Review Verification" : "No Verification Request"}
                </button>
                <button className="admin-btn" onClick={() => onToggleVerified(profile, !profile.verified)}>
                    {profile.verified ? "Set Not Verified" : "Set Verified"}
                </button>
            </div>

            <div className="admin-profile-review-card">
                <div className="admin-detail-group">
                    <label>Latest Verification Request</label>
                    {verification ? (
                        <>
                            <div className="admin-detail-grid">
                                <div className="admin-detail-group">
                                    <label>Status</label>
                                    <p><span className={`admin-badge admin-badge-${String(verification.status || "").toLowerCase()}`}>{verification.status}</span></p>
                                </div>
                                <DetailItem label="Requested Role" value={verification.type} />
                                <DetailItem label="Created" value={formatDate(verification.createdAt)} />
                                <div className="admin-detail-group">
                                    <label>Document</label>
                                    <p>{verification.documentUrl ? <a href={verification.documentUrl} target="_blank" rel="noreferrer" className="admin-link">Open document</a> : "-"}</p>
                                </div>
                            </div>

                            <DetailItem label="Admin Notes" value={verification.adminNotes} block />

                        </>
                    ) : (
                        <p className="admin-inline-note">This business profile does not currently have a verification request in the queue.</p>
                    )}
                </div>
            </div>

            {isReviewing ? (
                <div className="admin-review-box">
                    <div className="admin-role-management-box">
                        <label>{reviewState?.mode === "manual" ? "Current Roles" : "Role Management"}</label>
                        <div className="admin-role-management-note">
                            {reviewState?.mode === "manual"
                                ? "Provide a reason for this manual verification change. Existing roles are shown for context."
                                : "Removing a role here updates the user immediately and does not change the verification record by itself."}
                        </div>
                        <div className="admin-roles-wrap">
                            {currentRoles.length > 0 ? currentRoles.map((role) => (
                                <span key={role} className={`admin-role-pill ${reviewState?.mode === "verification" ? "admin-role-pill-removable" : ""}`}>
                                    {role}
                                    {reviewState?.mode === "verification" ? (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveRole(profile.userId, role)}
                                            disabled={changingRole === `${profile.userId}-${role}-remove`}
                                            title={`Remove ${role}`}
                                        >
                                            x
                                        </button>
                                    ) : null}
                                </span>
                            )) : <span className="admin-inline-note">No roles</span>}
                        </div>
                    </div>

                    <div className="admin-review-divider" />

                    <div className="admin-verification-review-box">
                        <label>{reviewState?.mode === "manual" ? "Verification Decision" : "Verification Review"}</label>
                        {reviewState?.mode === "verification" ? (
                            <>
                                <select value={reviewForm.status} onChange={(e) => onReviewFormChange((prev) => ({ ...prev, status: e.target.value }))}>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                    <option value="PENDING">PENDING</option>
                                </select>
                                <select
                                    value={reviewForm.selectedRole}
                                    onChange={(e) => onReviewFormChange((prev) => ({ ...prev, selectedRole: e.target.value }))}
                                    disabled={reviewForm.status !== "APPROVED"}
                                >
                                    <option value="">Select role to grant on approval</option>
                                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                                </select>
                                {reviewForm.status === "APPROVED" && reviewForm.selectedRole ? (
                                    <div className="admin-review-role-preview">On approval, this role will be granted: <strong>{reviewForm.selectedRole}</strong></div>
                                ) : null}
                            </>
                        ) : (
                            <div className="admin-review-role-preview">
                                This action will set the profile to <strong>{reviewState?.targetVerified ? "VERIFIED" : "NOT VERIFIED"}</strong>.
                            </div>
                        )}
                        <textarea
                            rows="4"
                            placeholder={reviewState?.mode === "manual"
                                ? `Reason for ${reviewState?.targetVerified ? "verifying" : "unverifying"}`
                                : reviewForm.status === "REJECTED"
                                    ? "Reason for rejection"
                                    : "Admin notes"}
                            value={reviewForm.adminNotes}
                            onChange={(e) => onReviewFormChange((prev) => ({ ...prev, adminNotes: e.target.value }))}
                        />
                        <div className="admin-review-role-preview">
                            A reason is required for this action.
                        </div>
                        <div className="admin-actions">
                            <button className="admin-btn admin-btn-primary" onClick={() => onSubmitReview(profile)} disabled={savingReview}>
                                {savingReview ? "Saving..." : "Save Review"}
                            </button>
                            <button className="admin-btn" onClick={onCancelReview} disabled={savingReview}>Cancel</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function DetailItem({ label, value, block = false }) {
    return (
        <div className="admin-detail-group" style={block ? undefined : null}>
            <label>{label}</label>
            <p>{value ?? "-"}</p>
        </div>
    );
}
