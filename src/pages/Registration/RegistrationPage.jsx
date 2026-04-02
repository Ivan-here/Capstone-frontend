import { useState } from "react";
import "./registration.css";
import { Link, useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { cloudinaryService } from "@/services/cloudinary.service";
import { profileService } from "@/services/profile.service";
import { ArrowLeft, BadgeCheck, CircleUserRound, ShieldCheck } from "lucide-react";

export default function RegistrationPage() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        displayName: "",
        role: "",
        email: "",
        username: "",
        password: "",
    });

    const navigate = useNavigate();

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

    function setField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null, form: null }));
    }

    function handleAvatarChange(ev) {
        const file = ev.target.files?.[0] || null;
        setAvatarFile(file);
        setErrors((prev) => ({ ...prev, avatar: null, form: null }));
        setAvatarPreviewUrl((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : "";
        });
    }

    function validate() {
        const e = {};

        if (!form.firstName.trim()) e.firstName = "First name is required.";
        if (!form.lastName.trim()) e.lastName = "Last name is required.";
        if (!form.role) e.role = "Please select a role.";
        if (form.displayName && form.displayName.trim().length > 120) {
            e.displayName = "Display name is too long.";
        }
        if (!form.email.trim()) e.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email.";

        if (!form.username.trim()) e.username = "Username is required.";
        else if (form.username.trim().length < 3) e.username = "Min 3 characters.";

        if (!form.password) e.password = "Password is required.";
        else if (form.password.length < 6) e.password = "Min 6 characters.";

        return e;
    }

    async function onSubmit(ev) {
        ev.preventDefault();
        const eMap = validate();
        setErrors(eMap);
        if (Object.values(eMap).some(Boolean)) return;

        try {
            setLoading(true);
            const avatarUrl = avatarFile ? await cloudinaryService.uploadImage(avatarFile) : null;

            const auth = await authService.register(form);

            await profileService.upsertPersonal({
                username: form.username,
                lastName: form.lastName,
                firstName: form.firstName,
                displayName: form.displayName,
                contactNumber: form.contactNumber,
                email: form.email,
                avatarUrl,
            });

            if (form.role === "SHOPPER") {
                navigate("/");
                return;
            }

            navigate(`/register/verify/${form.role.toLowerCase()}`, {
                state: {
                    userId: auth?.userId,
                },
            });
        } catch (err) {
            setErrors((prev) => ({
                ...prev,
                form: err.message || "Registration failed",
            }));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="authShell authShell--register">
            <main className="authMain">
                <div className="authHeader">
                    <div className="authHeaderCopy">
                        <h1>Create Your Account</h1>
                        <p className="authMuted">
                            Start with your core account details. Businesses and organizations will complete verification in the next step.
                        </p>
                    </div>
                    <button onClick={() => navigate(-1)} className="authBackLink">
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <form className="authCard" onSubmit={onSubmit}>
                    {errors.form && <div className="formError">{errors.form}</div>}

                    <div className="authSection">
                        <div className="authSectionTitle"><CircleUserRound size={18} /> Personal Identity</div>
                        <div className="authInputRow">
                            <Input
                                label="First name"
                                value={form.firstName}
                                onChange={(ev) => setField("firstName", ev.target.value)}
                                error={errors.firstName}
                            />
                            <Input
                                label="Last name"
                                value={form.lastName}
                                onChange={(ev) => setField("lastName", ev.target.value)}
                                error={errors.lastName}
                            />
                        </div>

                        <div className="authInputRow">
                            <div className="authSelectWrap">
                                <label className="authSelectLabel">Role</label>
                                <select
                                    className={`authSelect ${errors.role ? "authSelectError" : ""}`}
                                    value={form.role}
                                    onChange={(ev) => setField("role", ev.target.value)}
                                >
                                    <option value="">Please select a role</option>
                                    <option value="SHOPPER">Shopper</option>
                                    <option value="FARMER">Farmer</option>
                                    <option value="NGO">NGO</option>
                                    <option value="RESTAURANT">Restaurant</option>
                                </select>
                                {errors.role ? <div className="inputError">{errors.role}</div> : null}
                            </div>
                            <Input
                                label="Display name"
                                value={form.displayName}
                                onChange={(ev) => setField("displayName", ev.target.value)}
                                error={errors.displayName}
                                placeholder="Optional public name"
                            />
                        </div>

                        <div className="authUploadGroup">
                            <label className="authUploadLabel">Profile picture</label>
                            <div className="authUploadWrap">
                                <label className="authUploadBtn">
                                    <span>{avatarFile ? "Change picture" : "Upload picture"}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="authUploadInput"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                                {(avatarPreviewUrl || avatarFile?.name) && (
                                    <div className="authUploadPreviewRow">
                                        {avatarPreviewUrl ? (
                                            <img src={avatarPreviewUrl} alt="Profile preview" className="authUploadPreview" />
                                        ) : null}
                                        {avatarFile?.name ? <div className="authUploadFileName">{avatarFile.name}</div> : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="authSection">
                        <div className="authSectionTitle"><BadgeCheck size={18} /> Account Credentials</div>
                        <div className="authInputRow">
                            <Input
                                label="Email"
                                value={form.email}
                                onChange={(ev) => setField("email", ev.target.value)}
                                error={errors.email}
                            />
                            <Input
                                label="Username"
                                value={form.username}
                                onChange={(ev) => setField("username", ev.target.value)}
                                error={errors.username}
                            />
                        </div>

                        <div className="authInputRow authInputRow--single">
                            <Input
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={(ev) => setField("password", ev.target.value)}
                                error={errors.password}
                            />
                        </div>
                    </div>

                    <div className="authSection authSection--compact">
                        <div className="authSectionTitle"><ShieldCheck size={18} /> What Happens Next</div>
                        <p className="authHelperText">
                            Shoppers can start immediately after registration. Farmers, restaurants, and NGOs continue to a second step to add business details and upload verification documents.
                        </p>
                    </div>

                    <div className="authActions">
                        <Button type="submit" variant="primary" className="authPrimaryBtn" disabled={loading}>
                            {loading ? "Creating Account..." : "Continue"}
                        </Button>
                        <div className="authFooter">
                            <span>Already have an account?</span>
                            <Link className="authInlineLink" to="/login">
                                Log in
                            </Link>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
