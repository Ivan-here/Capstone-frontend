import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { profileService } from "@/services/profile.service";

function splitLines(text) {
    return text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
}

function joinLines(arr) {
    return (arr || []).join("\n");
}

export default function EditPersonalProfilePage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        username: "",
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

                setForm((prev) => ({
                    ...prev,
                    firstName: p?.firstName ?? "",
                    lastName: p?.lastName ?? "",
                    username: p?.username ?? "",
                    email: p?.email ?? "",
                    role: p?.role ?? "",
                    location: p?.location ?? "",
                    phone: p?.phone ?? "",
                    about: p?.about ?? "",
                    addressesText: joinLines(p?.addresses),
                    preferencesText: joinLines(p?.preferences),
                }));
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
        if (!form.firstName.trim()) e.firstName = "First name is required.";
        if (!form.lastName.trim()) e.lastName = "Last name is required.";
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

            await profileService.upsertPersonal({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),

                // optional
                role: form.role.trim() || null,
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
        <div className="profilePage">
            <main className="profileMain">
                <div className="profileContainer" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="card">
                        <div className="sectionTitle">Edit Personal Profile</div>
                        {errors.form && <div className="formError">{errors.form}</div>}

                        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                            <Input
                                value={form.firstName}
                                onChange={(e) => setField("firstName", e.target.value)}
                                error={errors.firstName}
                                placeholder="First name"
                            />
                            <Input
                                value={form.lastName}
                                onChange={(e) => setField("lastName", e.target.value)}
                                error={errors.lastName}
                                placeholder="Last name"
                            />
                            <label style={{ fontWeight: 700 }}>Username</label>
                            <Input value={form.username} disabled />
                            <div className="muted" style={{ fontSize: 12 }}>
                                Username can’t be changed.
                            </div>
                            <Input
                                value={form.email}
                                onChange={(e) => setField("email", e.target.value)}
                                error={errors.email}
                                placeholder="Email"
                            />
                            <Input
                                value={form.location}
                                onChange={(e) => setField("location", e.target.value)}
                                placeholder="Location"
                            />
                            <Input
                                value={form.phone}
                                onChange={(e) => setField("phone", e.target.value)}
                                placeholder="Phone"
                            />

                            <label style={{ fontWeight: 700 }}>About</label>
                            <textarea
                                className="textArea"
                                value={form.about}
                                onChange={(e) => setField("about", e.target.value)}
                                rows={4}
                            />

                            <label style={{ fontWeight: 700 }}>Addresses (one per line)</label>
                            <textarea
                                className="textArea"
                                value={form.addressesText}
                                onChange={(e) => setField("addressesText", e.target.value)}
                                rows={3}
                            />

                            <label style={{ fontWeight: 700 }}>Preferences (one per line)</label>
                            <textarea
                                className="textArea"
                                value={form.preferencesText}
                                onChange={(e) => setField("preferencesText", e.target.value)}
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
