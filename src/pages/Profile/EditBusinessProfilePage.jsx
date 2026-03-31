import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, MapPin, Mail, Clock, Truck, Info, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cloudinaryService } from "@/services/cloudinary.service";
import { profileService } from "@/services/profile.service";

const BUSINESS_TYPES = ["FARMER", "RESTAURANT", "NGO"];

export default function EditBusinessProfilePage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

    const [form, setForm] = useState({
        businessType: "FARMER",
        businessName: "",
        address: "",
        email: "",
        description: "",
        hours: "",
        serviceArea: "",
        eligibilityNotes: "",
        avatarUrl: "",
    });
    const avatarFallback = ((form.businessName || "B").trim().charAt(0) || "B").toUpperCase();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await profileService.getMe();
                const b = data?.businessProfile;

                if (b) {
                    setForm({
                        businessType: b.businessType || "FARMER",
                        businessName: b.businessName || "",
                        address: b.address || "",
                        email: b.email || "",
                        description: b.description || "",
                        hours: b.hours || "",
                        serviceArea: b.serviceArea || "",
                        eligibilityNotes: b.eligibilityNotes || "",
                        avatarUrl: b.avatarUrl || "",
                    });
                    setAvatarPreviewUrl(b.avatarUrl || "");
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function setField(name, value) {
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((e) => ({ ...e, [name]: null, form: null }));
    }

    function handleAvatarChange(ev) {
        const file = ev.target.files?.[0] || null;
        setAvatarFile(file);
        setErrors((e) => ({ ...e, avatar: null, form: null }));
        setAvatarPreviewUrl((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : (form.avatarUrl || "");
        });
    }

    // FIXED: Validation logic included to prevent ReferenceErrors
    function validate() {
        const e = {};
        if (!form.businessType) e.businessType = "Business type is required.";
        if (!form.businessName.trim()) e.businessName = "Business name is required.";
        if (!form.address.trim()) e.address = "Address is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email.";
        return e;
    }

    // FIXED: onSubmit logic included to handle API call
    async function onSubmit(ev) {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.values(e).some(Boolean)) return;

        try {
            setSaving(true);
            const avatarUrl = avatarFile ? await cloudinaryService.uploadImage(avatarFile) : (form.avatarUrl || null);
            await profileService.upsertBusiness({
                businessType: form.businessType,
                businessName: form.businessName.trim(),
                address: form.address.trim(),
                email: form.email.trim(),
                avatarUrl,
                description: form.description.trim() || null,
                hours: form.hours.trim() || null,
                serviceArea: form.serviceArea.trim() || null,
                eligibilityNotes: form.eligibilityNotes.trim() || null,
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
                    <div className="edit-header-copy">
                        <h1>Business Profile Editing</h1>
                        <p className="muted">Configure your marketplace presence and logistics</p>
                    </div>
                    <button onClick={() => navigate("/profile")} className="back-link">
                        <ArrowLeft size={18} /> Back to Profile
                    </button>
                </div>

                <div className="profileContainer edit-grid">
                    <form onSubmit={onSubmit} className="edit-form-card">
                        {errors.form && <div className="formError">{errors.form}</div>}

                        {/* Section 1: Marketplace Identity */}
                        <div className="form-section">
                            <div className="section-title"><Store size={18} /> Marketplace Identity</div>
                            <div className="input-group avatar-editor-group">
                                <label>Business Picture</label>
                                <div className="profileAvatarEditor">
                                    <div className="profileAvatarEditorPreview">
                                        {avatarPreviewUrl ? (
                                            <img src={avatarPreviewUrl} alt="Business avatar preview" className="profileAvatarEditorImage" />
                                        ) : (
                                            <span className="avatarInner">{avatarFallback}</span>
                                        )}
                                    </div>
                                    <label className="avatarUploadBtn">
                                        <span>{avatarFile ? "Change picture" : "Upload picture"}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="avatarUploadInput"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="input-row">
                                <Input
                                    label="Business Name"
                                    value={form.businessName}
                                    onChange={(e) => setField("businessName", e.target.value)}
                                    error={errors.businessName}
                                />
                                <div className="input-group">
                                    <label>Entity Type</label>
                                    <select
                                        className="premium-select"
                                        value={form.businessType}
                                        onChange={(e) => setField("businessType", e.target.value)}
                                    >
                                        {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="input-row">
                                <Input
                                    label="Business Address"
                                    icon={<MapPin size={16}/>}
                                    value={form.address}
                                    onChange={(e) => setField("address", e.target.value)}
                                    error={errors.address}
                                />
                                <Input
                                    label="Public Email"
                                    icon={<Mail size={16}/>}
                                    value={form.email}
                                    onChange={(e) => setField("email", e.target.value)}
                                    error={errors.email}
                                />
                            </div>
                        </div>

                        {/* Section 2: Bio & Description */}
                        <div className="form-section">
                            <div className="section-title"><Info size={18} /> About Your Business</div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea
                                    className="premium-textarea"
                                    value={form.description}
                                    onChange={(e) => setField("description", e.target.value)}
                                    rows={4}
                                    placeholder="Describe what your business offers to the community..."
                                />
                            </div>
                        </div>

                        {/* Section 3: Logistics & Operations */}
                        <div className="form-section">
                            <div className="section-title"><Truck size={18} /> Logistics & Operations</div>
                            <div className="input-row">
                                <Input
                                    label="Operating Hours"
                                    icon={<Clock size={16}/>}
                                    placeholder="e.g. Mon-Fri, 9am - 5pm"
                                    value={form.hours}
                                    onChange={(e) => setField("hours", e.target.value)}
                                />
                                <Input
                                    label="Service Area"
                                    placeholder="e.g. Greater Toronto Area"
                                    value={form.serviceArea}
                                    onChange={(e) => setField("serviceArea", e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label>Pickup Instructions</label>
                                <textarea
                                    className="premium-textarea"
                                    value={form.eligibilityNotes}
                                    onChange={(e) => setField("eligibilityNotes", e.target.value)}
                                    rows={3}
                                    placeholder="Add specific instructions for order collection..."
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => navigate("/profile")}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={saving} className="save-btn">
                                {saving ? "Saving Changes..." : "Save Business Profile"}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
