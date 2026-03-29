import { useState } from "react";
import { LifeBuoy, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { supportService } from "@/services/support.service";

const CATEGORIES = [
    { value: "BUG", label: "Report a bug" },
    { value: "HELP", label: "Ask for help" },
    { value: "ACCOUNT", label: "Account issue" },
    { value: "VERIFICATION", label: "Verification support" },
    { value: "ORDER_DISPUTE", label: "Dispute an order" },
];

export default function ContactStaffButton() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [form, setForm] = useState({
        category: "HELP",
        subject: "",
        message: "",
        referenceId: "",
    });

    function resetMessages() {
        setError("");
        setNotice("");
    }

    function openModal() {
        if (!authService.isLoggedIn()) {
            navigate("/login");
            return;
        }

        resetMessages();
        setOpen(true);
    }

    function closeModal() {
        if (submitting) return;
        setOpen(false);
        resetMessages();
    }

    function updateField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
        resetMessages();
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.subject.trim() || !form.message.trim()) {
            setError("Subject and message are required.");
            return;
        }

        try {
            setSubmitting(true);
            resetMessages();

            await supportService.createStaffRequest({
                category: form.category,
                subject: form.subject.trim(),
                message: form.message.trim(),
                referenceType: form.category === "ORDER_DISPUTE" ? "ORDER" : null,
                referenceId: form.category === "ORDER_DISPUTE" ? form.referenceId.trim() : null,
                contextPath: location.pathname,
            });

            setNotice("Your request was sent to staff.");
            setForm({
                category: "HELP",
                subject: "",
                message: "",
                referenceId: "",
            });
        } catch (err) {
            setError(err.message || "Failed to send staff request.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                className="btn-icon"
                onClick={openModal}
                title="Contact staff"
                aria-label="Contact staff"
            >
                <LifeBuoy size={22} />
            </button>

            {open ? (
                <div className="support-modal-backdrop" onClick={closeModal}>
                    <div
                        className="support-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-staff-title"
                    >
                        <div className="support-modal-header">
                            <div>
                                <h2 id="contact-staff-title">Contact Staff</h2>
                                <p>Report a bug, ask for help, or flag an account issue.</p>
                            </div>
                            <button
                                type="button"
                                className="support-modal-close"
                                onClick={closeModal}
                                disabled={submitting}
                                aria-label="Close contact staff dialog"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form className="support-modal-form" onSubmit={handleSubmit}>
                            <label>
                                Category
                                <select
                                    value={form.category}
                                    onChange={(event) => updateField("category", event.target.value)}
                                >
                                    {CATEGORIES.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {form.category === "ORDER_DISPUTE" ? (
                                <label>
                                    Order ID
                                    <input
                                        type="text"
                                        maxLength={120}
                                        value={form.referenceId}
                                        onChange={(event) => updateField("referenceId", event.target.value)}
                                        placeholder="Order number"
                                    />
                                </label>
                            ) : null}

                            <label>
                                Subject
                                <input
                                    type="text"
                                    maxLength={120}
                                    value={form.subject}
                                    onChange={(event) => updateField("subject", event.target.value)}
                                    placeholder="Short summary"
                                />
                            </label>

                            <label>
                                Message
                                <textarea
                                    rows="6"
                                    maxLength={2000}
                                    value={form.message}
                                    onChange={(event) => updateField("message", event.target.value)}
                                    placeholder="Describe the issue and what you need from staff."
                                />
                            </label>

                            <div className="support-modal-context">
                                Current page: <strong>{location.pathname}</strong>
                            </div>

                            {error ? <div className="support-modal-error">{error}</div> : null}
                            {notice ? <div className="support-modal-notice">{notice}</div> : null}

                            <div className="support-modal-actions">
                                <button type="button" className="support-modal-secondary" onClick={closeModal} disabled={submitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="support-modal-primary" disabled={submitting}>
                                    {submitting ? "Sending..." : "Send request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}
