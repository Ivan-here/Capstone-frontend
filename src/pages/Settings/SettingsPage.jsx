import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileCheck, Shield, Trash2 } from "lucide-react";
import { settingsService } from "@/services/settings.service";
import { profileService } from "@/services/profile.service";
import { authService } from "@/services/auth.service";
import "./settings.css";

const VERIFICATION_TYPES = ["FARMER", "RESTAURANT", "NGO"];

export default function SettingsPage() {
    const navigate = useNavigate();
    const [overview, setOverview] = useState(null);
    const [verification, setVerification] = useState(null);
    const [verificationType, setVerificationType] = useState("FARMER");
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busyAction, setBusyAction] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                setNotice("");

                const [overviewData, meData] = await Promise.all([
                    settingsService.getOverview(),
                    profileService.getMe(),
                ]);

                setOverview(overviewData);
                const defaultType = meData?.businessProfile?.businessType || "FARMER";
                setVerificationType(defaultType);

                try {
                    const verificationData = await settingsService.getBusinessVerification();
                    setVerification(verificationData);
                } catch {
                    setVerification(null);
                }
            } catch (err) {
                setError(err?.message || "Failed to load settings.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const runAction = async (actionName, action) => {
        try {
            setBusyAction(actionName);
            setError("");
            setNotice("");
            await action();
        } catch (err) {
            setError(err?.message || "Action failed.");
        } finally {
            setBusyAction("");
        }
    };

    const handleResubmit = async (e) => {
        e.preventDefault();
        if (!document) {
            setError("Please attach a verification document.");
            return;
        }

        await runAction("resubmit", async () => {
            const created = await settingsService.resubmitVerification({
                type: verificationType,
                document,
            });
            setVerification(created);
            setDocument(null);
            setNotice("Verification document submitted. Admin review was requested automatically.");
        });
    };

    const handleDeleteBusiness = async () => {
        if (!window.confirm("Delete your business profile and verification history?")) return;

        await runAction("delete-business", async () => {
            await settingsService.deleteBusinessProfile();
            const updatedOverview = await settingsService.getOverview();
            setOverview(updatedOverview);
            setVerification(null);
            setNotice("Business profile deleted.");
        });
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Delete your full account permanently? This cannot be undone.")) return;

        await runAction("delete-account", async () => {
            await settingsService.deleteAccount();
            authService.logout();
            navigate("/login", { replace: true });
        });
    };

    if (loading) return <div className="profilePage">Loading settings...</div>;

    return (
        <div className="profilePage edit-page-bg settings-page-shell">
            <main className="profileMain settings-main">
                <div className="settings-page-inner">
                    <div className="edit-header settings-hero">
                        <button className="back-link" onClick={() => navigate("/profile")}>
                            <ArrowLeft size={18} /> Back to Profile
                        </button>
                        <h1>Account Settings</h1>
                        <p className="muted">Manage verification, profile state, and account-level controls.</p>
                    </div>

                    {error ? <div className="settings-error">{error}</div> : null}
                    {notice ? <div className="settings-notice">{notice}</div> : null}

                    <div className="profileContainer settings-layout">
                        <section className="card settings-summary-card">
                            <div className="section-title"><Shield size={18} /> Account Overview</div>
                            <div className="settings-summary-grid">
                                <div className="settings-summary-item">
                                    <span>Personal profile</span>
                                    <b>{overview?.hasPersonalProfile ? "Available" : "Missing"}</b>
                                </div>
                                <div className="settings-summary-item">
                                    <span>Business profile</span>
                                    <b>{overview?.hasBusinessProfile ? "Available" : "Missing"}</b>
                                </div>
                                <div className="settings-summary-item">
                                    <span>Business verified</span>
                                    <b>{overview?.businessVerified ? "Yes" : "No"}</b>
                                </div>
                                <div className="settings-summary-item">
                                    <span>Pending admin review</span>
                                    <b>{overview?.hasPendingVerificationReview ? "Yes" : "No"}</b>
                                </div>
                            </div>
                        </section>

                        {overview?.hasBusinessProfile ? (
                            <section className="card settings-verification-card">
                                <div className="section-title"><FileCheck size={18} /> Business Verification Documents</div>
                                <p className="muted settings-card-intro">View your latest uploaded business document and resubmit if needed.</p>

                                {verification ? (
                                    <div className="settings-verification-meta">
                                        <div className="settings-meta-row">
                                            <span>Status</span>
                                            <b>{verification.status}</b>
                                        </div>
                                        <div className="settings-meta-row">
                                            <span>Type</span>
                                            <b>{verification.type}</b>
                                        </div>
                                        {verification.adminNotes ? (
                                            <div className="settings-meta-notes">
                                                Admin notes: {verification.adminNotes}
                                            </div>
                                        ) : null}
                                        {verification.documentUrl ? (
                                            <a href={verification.documentUrl} target="_blank" rel="noreferrer" className="linkBtn">
                                                View current uploaded document
                                            </a>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="settings-verification-meta">No verification document found yet.</div>
                                )}

                                <form onSubmit={handleResubmit} className="settings-form">
                                    <div className="input-row">
                                        <label className="input-group">
                                            <span className="input-label">Business type</span>
                                            <select
                                                className="premium-select"
                                                value={verificationType}
                                                onChange={(e) => setVerificationType(e.target.value)}
                                            >
                                                {VERIFICATION_TYPES.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="input-group">
                                            <span className="input-label">Document</span>
                                            <input
                                                className="settings-file-input"
                                                type="file"
                                                onChange={(e) => setDocument(e.target.files?.[0] || null)}
                                                accept=".pdf,.png,.jpg,.jpeg"
                                            />
                                        </label>
                                    </div>

                                    <div className="form-actions settings-form-actions">
                                        <button className="btn-primary settings-submit-btn" type="submit" disabled={busyAction === "resubmit"}>
                                            {busyAction === "resubmit" ? "Submitting..." : "Resubmit Document"}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        ) : null}

                        <section className="card settings-danger-card">
                            <div className="section-title"><Trash2 size={18} /> Danger Zone</div>
                            <p className="muted settings-card-intro">These actions are destructive and cannot be undone.</p>
                            <div className="settings-danger-actions">
                                <button onClick={handleDeleteBusiness} disabled={busyAction === "delete-business"}>
                                    Delete Business Profile
                                </button>
                                <button onClick={handleDeleteAccount} disabled={busyAction === "delete-account"}>
                                    Delete Full Account
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
