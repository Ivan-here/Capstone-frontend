import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Phone, Mail, Heart, Info, ArrowLeft, AlignLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { profileService } from "@/services/profile.service";

// --- Helper Functions ---
function splitLines(text) {
    return text
        ? text.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];
}

function joinLines(arr) {
    return (arr || []).join("\n");
}

export default function EditPersonalProfilePage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // --- State Management ---
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        username: "",
        displayName: "",
        email: "",
        role: "",
        location: "",
        phone: "",
        about: "",
        addressesText: "",
        preferencesText: "",
    });

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await profileService.getMe();
                const p = data?.personalProfile;

                setForm({
                    firstName: p?.firstName ?? "",
                    lastName: p?.lastName ?? "",
                    username: p?.username ?? "",
                    displayName: p?.displayName ?? "",
                    email: p?.email ?? "",
                    role: p?.role ?? "",
                    location: p?.location ?? "",
                    phone: p?.phone ?? "",
                    about: p?.about ?? "",
                    addressesText: joinLines(p?.addresses),
                    preferencesText: joinLines(p?.preferences),
                });
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function setField(name, value) {
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((e) => ({ ...e, [name]: null, form: null }));
    }

    // --- Validation Logic ---
    function validate() {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "First name is required.";
        if (!form.lastName.trim()) e.lastName = "Last name is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email.";
        return e;
    }

    // --- Submit Logic (FIXED: Added back the missing function) ---
    async function onSubmit(ev) {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.values(e).some(Boolean)) return;

        try {
            setSaving(true);
            await profileService.upsertPersonal({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                displayName: form.displayName.trim() || null,
                location: form.location.trim() || null,
                phone: form.phone.trim() || null,
                about: form.about.trim() || null,
                addresses: splitLines(form.addressesText),
                preferences: splitLines(form.preferencesText),
            });
            navigate("/profile");
        } catch (err) {
            setErrors((p) => ({ ...p, form: err.message || "Save failed" }));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="profilePage">Loading...</div>;

    return (
        <div className="profilePage edit-page-bg">
            <main className="profileMain">
                <div className="edit-header">
                    <button onClick={() => navigate("/profile")} className="back-link">
                        <ArrowLeft size={18} /> Back to Profile
                    </button>
                    <h1>Personal Settings</h1>
                    <p className="muted">Manage how you appear to the community</p>
                </div>

                <div className="profileContainer edit-grid">
                    <form onSubmit={onSubmit} className="edit-form-card">
                        {errors.form && <div className="formError" style={{ color: 'red', marginBottom: '1rem' }}>{errors.form}</div>}

                        {/* Section 1: Public Identity */}
                        <div className="form-section">
                            <div className="section-title"><User size={18} /> Public Identity</div>
                            <div className="input-row">
                                <Input label="First Name" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} error={errors.firstName} />
                                <Input label="Last Name" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} error={errors.lastName} />
                            </div>
                            <div className="input-row">
                                <div className="input-group">
                                    <label className="input-label">Username</label>
                                    <Input value={form.username} disabled className="disabled-input" />
                                    <span className="input-hint">User IDs cannot be changed.</span>
                                </div>
                                <Input label="Display Name" placeholder="e.g. GreenThumb99" value={form.displayName} onChange={(e) => setField("displayName", e.target.value)} />
                            </div>
                        </div>

                        {/* Section 2: Contact & Location */}
                        <div className="form-section">
                            <div className="section-title"><Mail size={18} /> Contact & Reach</div>
                            <Input label="Email Address" value={form.email} onChange={(e) => setField("email", e.target.value)} error={errors.email} />
                            <div className="input-row">
                                <Input label="Location" icon={<MapPin size={16}/>} value={form.location} onChange={(e) => setField("location", e.target.value)} />
                                <Input label="Phone" icon={<Phone size={16}/>} value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                            </div>
                        </div>

                        {/* Section 3: Biography & Preferences */}
                        <div className="form-section">
                            <div className="section-title"><Info size={18} /> About You</div>
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">Bio</label>
                                <textarea className="premium-textarea" value={form.about} onChange={(e) => setField("about", e.target.value)} rows={4} placeholder="Tell the community about your sustainable journey..." />
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label className="input-label"><Heart size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Preferences (One per line)</label>
                                    <textarea className="premium-textarea" value={form.preferencesText} onChange={(e) => setField("preferencesText", e.target.value)} rows={3} placeholder="Organic&#10;Vegan&#10;Plastic-free" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label"><AlignLeft size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Addresses (One per line)</label>
                                    <textarea className="premium-textarea" value={form.addressesText} onChange={(e) => setField("addressesText", e.target.value)} rows={3} placeholder="Home: 123 Maple St&#10;Office: 456 Oak Ave" />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => navigate("/profile")}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={saving} className="save-btn">
                                {saving ? "Saving Changes..." : "Save Profile"}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}