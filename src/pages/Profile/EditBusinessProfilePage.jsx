import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { profileService } from "@/services/profile.service";

const BUSINESS_TYPES = ["FARMER", "RESTAURANT", "NGO"];

export default function EditBusinessProfilePage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        businessType: "FARMER",
        businessName: "",
        address: "",
        email: "",
        description: "",
        hours: "",
        serviceArea: "",
        eligibilityNotes: "",
    });

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
                    });
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

    function validate() {
        const e = {};
        if (!form.businessType) e.businessType = "Business type is required.";
        if (!form.businessName.trim()) e.businessName = "Business name is required.";
        if (!form.address.trim()) e.address = "Address is required.";
        if (!form.email.trim()) e.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email.";
        return e;
    }

    async function onSubmit(ev) {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.values(e).some(Boolean)) return;

        try {
            setSaving(true);

            await profileService.upsertBusiness({
                businessType: form.businessType,
                businessName: form.businessName.trim(),
                address: form.address.trim(),
                email: form.email.trim(),

                // optional
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
        <div className="profilePage">
            <main className="profileMain">
                <div className="profileContainer" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="card">
                        <div className="sectionTitle">Edit Business Profile</div>
                        {errors.form && <div className="formError">{errors.form}</div>}

                        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                            {errors.businessType && <div className="inputError">{errors.businessType}</div>}

                            <Input
                                value={form.businessName}
                                onChange={(e) => setField("businessName", e.target.value)}
                                error={errors.businessName}
                                placeholder="Business name"
                            />
                            <Input
                                value={form.address}
                                onChange={(e) => setField("address", e.target.value)}
                                error={errors.address}
                                placeholder="Address"
                            />
                            <Input
                                value={form.email}
                                onChange={(e) => setField("email", e.target.value)}
                                error={errors.email}
                                placeholder="Business email"
                            />

                            <label style={{ fontWeight: 700 }}>Description</label>
                            <textarea
                                className="textArea"
                                value={form.description}
                                onChange={(e) => setField("description", e.target.value)}
                                rows={4}
                            />

                            <Input
                                value={form.hours}
                                onChange={(e) => setField("hours", e.target.value)}
                                placeholder="Hours e.g. (9:00 - 18:00)"
                            />
                            <Input
                                value={form.serviceArea}
                                onChange={(e) => setField("serviceArea", e.target.value)}
                                placeholder="Service area"
                            />

                            <label style={{ fontWeight: 700 }}>Pickup instructions</label>
                            <textarea
                                className="textArea"
                                value={form.eligibilityNotes}
                                onChange={(e) => setField("eligibilityNotes", e.target.value)}
                                rows={3}
                            />

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
