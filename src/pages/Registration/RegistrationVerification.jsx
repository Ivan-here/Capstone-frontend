import { useMemo, useState } from "react";
import "./registration.css";
import "./registration-verification.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { profileService } from "@/services/profile.service";
import { verificationService } from "@/services/verification.service";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/services/auth.service.js";
import { cloudinaryService } from "@/services/cloudinary.service";
import { ArrowLeft, Building2, Clock3, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

export default function RegistrationVerification() {
    const { role } = useParams();
    const ui = useMemo(() => getRoleUI(role), [role]);

    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId || authService.getUserId();

    const [form, setForm] = useState({
        name: "",
        description: "",
        address: "",
        email: "",
        phone: "",
        hours: "",
        pickupAvailability: "",
        documents: null,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

    function setField(key, value) {
        setForm((p) => ({ ...p, [key]: value }));
        setErrors((p) => ({ ...p, [key]: null, form: null }));
    }

    function handleAvatarChange(ev) {
        const file = ev.target.files?.[0] || null;
        setAvatarFile(file);
        setErrors((p) => ({ ...p, avatar: null, form: null }));
        setAvatarPreviewUrl((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : "";
        });
    }

    function validate() {
        const e = {};

        if (!userId) e.form = "Missing userId. Please register again and come back.";
        if (!form.name.trim()) e.name = `${ui.nameLabel} is required.`;
        if (!form.description.trim()) e.description = "Profile description is required.";
        if (!form.address.trim()) e.address = `${ui.addressLabel} is required.`;

        if (!form.email.trim()) e.email = `${ui.emailLabel} is required.`;
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email.";
        if (!form.phone.trim()) e.phone = "Business phone is required.";
        if (!form.documents || form.documents.length === 0) {
            e.documents = "Please upload verification documents to prove your business is legitimate.";
        }

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

            await profileService.upsertBusiness({
                address: form.address,
                businessName: form.name,
                businessType: String(role || "").toUpperCase(),
                email: form.email,
                phone: form.phone.trim(),
                emailVisibility: "PUBLIC",
                phoneVisibility: "PUBLIC",
                avatarUrl,
                description: form.description,
                hours: form.hours.trim() || null,
                pickupAvailability: form.pickupAvailability.trim() || null,
            });

            const formData = new FormData();
            const verificationRequest = {
                userId,
                type: String(role || "").toUpperCase(),
            };

            formData.append(
                "request",
                new Blob([JSON.stringify(verificationRequest)], {
                    type: "application/json",
                })
            );
            formData.append("document", form.documents[0]);

            try {
                await verificationService.submitVerification(formData);
                navigate("/");
            } catch {
                setErrors((p) => ({
                    ...p,
                    form: "Business profile saved, but document upload failed. Please retry verification.",
                }));
            }
        } catch (err) {
            setErrors((p) => ({
                ...p,
                form: err.message || "Registration failed",
            }));
        } finally {
            setLoading(false);
        }
    }

    function getRoleUI(roleValue) {
        const r = String(roleValue || "").toUpperCase();

        if (r === "FARMER") {
            return {
                title: "Farmer Verification",
                nameLabel: "Farm Name",
                addressLabel: "Farm Address",
                emailLabel: "Business email",
                uploadHint: "Upload proof of farm/business",
            };
        }

        if (r === "RESTAURANT") {
            return {
                title: "Restaurant Verification",
                nameLabel: "Business Name",
                addressLabel: "Business Address",
                emailLabel: "Business email",
                uploadHint: "Upload proof of restaurant/business",
            };
        }

        if (r === "NGO") {
            return {
                title: "NGO Verification",
                nameLabel: "Organization Name",
                addressLabel: "Organization Address",
                emailLabel: "Organization email",
                uploadHint: "Upload proof of organization",
            };
        }

        return {
            title: "Business Verification",
            nameLabel: "Name",
            addressLabel: "Address",
            emailLabel: "Email",
            uploadHint: "Upload verification documents",
        };
    }

    return (
        <div className="authShell authShell--verification rvPage">
            <main className="authMain rvMain">
                <div className="authHeader rvHeader">
                    <div className="authHeaderCopy">
                        <h1>{ui.title}</h1>
                        <p className="authMuted">Finish your business setup, add pickup details, and submit verification.</p>
                    </div>
                    <button onClick={() => navigate(-1)} className="authBackLink">
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <form className="authCard rvFormCard" onSubmit={onSubmit}>
                    {errors.form && <div className="formError">{errors.form}</div>}

                    <div className="authSection">
                        <div className="authSectionTitle"><Building2 size={18} /> Business Identity</div>

                        <div className="authInputRow">
                            <Input
                                label={ui.nameLabel}
                                value={form.name}
                                onChange={(e) => setField("name", e.target.value)}
                                error={errors.name}
                            />
                            <Input
                                label={ui.addressLabel}
                                icon={<MapPin size={16} />}
                                value={form.address}
                                onChange={(e) => setField("address", e.target.value)}
                                error={errors.address}
                            />
                        </div>

                        <div className="authInputRow">
                            <Input
                                label={ui.emailLabel}
                                icon={<Mail size={16} />}
                                value={form.email}
                                onChange={(e) => setField("email", e.target.value)}
                                error={errors.email}
                            />
                            <Input
                                label="Business phone"
                                icon={<Phone size={16} />}
                                value={form.phone}
                                onChange={(e) => setField("phone", e.target.value)}
                                error={errors.phone}
                            />
                        </div>

                        <p className="authHelperText">
                            Business email and phone start public so customers can coordinate pickups. You can change visibility later in profile settings.
                        </p>

                        <div className="authInputGroup">
                            <label className="authInputLabel">Profile description</label>
                            <textarea
                                className="authTextarea"
                                rows={4}
                                value={form.description}
                                onChange={(e) => setField("description", e.target.value)}
                                placeholder="Describe your business, what you sell, and how pickups usually work."
                            />
                            {errors.description ? <div className="inputError">{errors.description}</div> : null}
                        </div>
                    </div>

                    <div className="authSection">
                        <div className="authSectionTitle"><Clock3 size={18} /> Pickup Planning</div>
                        <div className="authInputRow">
                            <Input
                                label="Business hours"
                                icon={<Clock3 size={16} />}
                                value={form.hours}
                                onChange={(e) => setField("hours", e.target.value)}
                                placeholder="Mon-Fri 9am-5pm"
                            />
                            <Input
                                label="Pickup availability"
                                icon={<Clock3 size={16} />}
                                value={form.pickupAvailability}
                                onChange={(e) => setField("pickupAvailability", e.target.value)}
                                placeholder="Tue-Thu 2pm-6pm, Sat 10am-1pm"
                            />
                        </div>
                    </div>

                    <div className="authSection">
                        <div className="authSectionTitle"><ShieldCheck size={18} /> Verification Assets</div>

                        <div className="authInputGroup rvUploadGroup">
                            <label className="authInputLabel">Profile picture</label>
                            <div className="uploadWrap">
                                <label className="uploadBtn">
                                    <span className="uploadText">{avatarFile ? "Change business photo" : "Upload business photo"}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="uploadInput"
                                        onChange={handleAvatarChange}
                                    />
                                </label>

                                {(avatarPreviewUrl || avatarFile?.name) && (
                                    <div className="avatarUploadPreviewRow">
                                        {avatarPreviewUrl ? (
                                            <img src={avatarPreviewUrl} alt="Business profile preview" className="avatarUploadPreview" />
                                        ) : null}
                                        {avatarFile?.name ? <div className="fileItem">{avatarFile.name}</div> : null}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="authInputGroup rvUploadGroup">
                            <label className="authInputLabel">Verification documents</label>
                            <div className="uploadWrap">
                                <label className={`uploadBtn ${errors.documents ? "uploadBtnError" : ""}`}>
                                    <span className="uploadText">{ui.uploadHint}</span>
                                    <input
                                        type="file"
                                        className="uploadInput"
                                        onChange={(e) => setField("documents", e.target.files)}
                                    />
                                </label>

                                {form.documents && form.documents.length > 0 ? (
                                    <div className="fileList">
                                        <div className="fileItem">{form.documents[0].name}</div>
                                    </div>
                                ) : null}

                                {errors.documents ? <div className="inputError">{errors.documents}</div> : null}
                            </div>
                        </div>
                    </div>

                    <div className="authActions authActions--split">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="authSecondaryBtn">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" className="authPrimaryBtn" disabled={loading}>
                            {loading ? "Submitting..." : "Submit for Verification"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
