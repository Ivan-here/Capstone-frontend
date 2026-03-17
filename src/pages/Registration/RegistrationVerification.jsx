import { useMemo, useState } from "react";
import "./registration-verification.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { profileService } from "@/services/profile.service";
import { verificationService } from "@/services/verification.service"; // NEW IMPORT

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegistrationVerification() {
    const { role } = useParams();
    const ui = useMemo(() => getRoleUI(role), [role]);

    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId;

    const [form, setForm] = useState({
        name: "",
        description: "",
        address: "",
        email: "",
        documents: null,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    function setField(key, value) {
        setForm((p) => ({ ...p, [key]: value }));
        setErrors((p) => ({ ...p, [key]: null, form: null }));
    }

    function validate() {
        const e = {};

        if (!userId) e.form = "Missing userId. Please register again and come back.";

        if (!form.name.trim()) e.name = `${ui.nameLabel} is required.`;
        if (!form.description.trim()) e.description = "Profile description is required.";
        if (!form.address.trim()) e.address = `${ui.addressLabel} is required.`;

        if (!form.email.trim()) e.email = `${ui.emailLabel} is required.`;
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email.";

        // ACTIVATED: Documents are now mandatory!
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

            // 1) Create business profile
            await profileService.upsertBusiness({
                address: form.address,
                name: form.name,
                businessType: String(role || "").toUpperCase(),
                email: form.email,
                description: form.description,
            });

            // 2) Build FormData for Verification Service
            const formData = new FormData();

            // Build the JSON DTO exactly as backend expects
            const verificationRequest = {
                userId: userId,
                type: String(role || "").toUpperCase()
            };

            formData.append("request", new Blob([JSON.stringify(verificationRequest)], {
                type: "application/json"
            }));

            // Append the actual file (taking the first file since backend expects one)
            formData.append("document", form.documents[0]);

            // 3) Submit to Verification Backend
            await verificationService.submitVerification(formData);

            // Navigate to home/dashboard upon complete success
            navigate("/");
        } catch (err) {
            setErrors((p) => ({
                ...p,
                form: err.message || "Verification failed",
            }));
        } finally {
            setLoading(false);
        }
    }

    function getRoleUI(role) {
        const r = String(role || "").toUpperCase();

        if (r === "FARMER") {
            return {
                title: "REGISTER AS A FARMER",
                nameLabel: "Farm Name",
                addressLabel: "Farm Address",
                emailLabel: "Business email",
                uploadHint: "Upload proof of farm/business",
            };
        }

        if (r === "RESTAURANT") {
            return {
                title: "REGISTER AS A RESTAURANT",
                nameLabel: "Business Name",
                addressLabel: "Business Address",
                emailLabel: "Business email",
                uploadHint: "Upload proof of restaurant/business",
            };
        }

        if (r === "NGO") {
            return {
                title: "REGISTER AS AN NGO",
                nameLabel: "Organization Name",
                addressLabel: "Organization Address",
                emailLabel: "Organization email",
                uploadHint: "Upload proof of organization",
            };
        }

        return {
            title: "REGISTER",
            nameLabel: "Name",
            addressLabel: "Address",
            emailLabel: "Email",
            uploadHint: "Upload verification documents",
        };
    }

    return (
        <div className="rvPage">
            <div className="rvCard">
                <h1 className="rvTitle">{ui.title}</h1>

                <form className="rvForm" onSubmit={onSubmit}>
                    {errors.form && <div className="formError">{errors.form}</div>}

                    <div className="fieldRow">
                        <label className="fieldLabel">{ui.nameLabel}:</label>
                        <Input
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            error={errors.name}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Profile description:</label>
                        <Input
                            value={form.description}
                            onChange={(e) => setField("description", e.target.value)}
                            error={errors.description}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">{ui.addressLabel}:</label>
                        <Input
                            value={form.address}
                            onChange={(e) => setField("address", e.target.value)}
                            error={errors.address}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">{ui.emailLabel}:</label>
                        <Input
                            value={form.email}
                            onChange={(e) => setField("email", e.target.value)}
                            error={errors.email}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Verification Documents:</label>
                        <div className="uploadWrap">
                            <label className={`uploadBtn ${errors.documents ? "uploadBtnError" : ""}`}>
                                <span className="uploadIcon">⤴</span>
                                <span className="uploadText">{ui.uploadHint}</span>
                                <input
                                    type="file"
                                    className="uploadInput"
                                    onChange={(e) => setField("documents", e.target.files)}
                                />
                            </label>

                            {form.documents && form.documents.length > 0 && (
                                <div className="fileList">
                                    <div className="fileItem">
                                        {form.documents[0].name}
                                    </div>
                                </div>
                            )}

                            {errors.documents && <div className="inputError">{errors.documents}</div>}
                        </div>
                    </div>

                    <div className="submitRow">
                        <Button type="submit" variant="primary" className="registerBtn" disabled={loading}>
                            {loading ? "Submitting..." : "Register"}
                        </Button>
                    </div>
                </form>

                <div className="rvFooter">
                    <span>Already have an account?</span>
                    <a className="loginLink" href="/login">
                        Login →
                    </a>
                </div>
            </div>
        </div>
    );
}