import { useState } from "react";
import "./registration.css";
import { useNavigate } from "react-router-dom";

import Button from "@/components/layout/Button";
import Input from "@/components/layout/Input";
import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";

export default function RegistrationPage() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        role: "",
        email: "",
        username: "",
        password: "",
        contactNumber: "",
    });

    const navigate = useNavigate();

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    function setField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null, form: null }));
    }

    function validate() {
        const e = {};

        if (!form.firstName.trim()) e.firstName = "First name is required.";
        if (!form.lastName.trim()) e.lastName = "Last name is required.";
        if (!form.role) e.role = "Please select a role.";

        if (!form.email.trim()) e.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email.";

        if (!form.username.trim()) e.username = "Username is required.";
        else if (form.username.trim().length < 3) e.username = "Min 3 characters.";

        if (!form.password) e.password = "Password is required.";
        else if (form.password.length < 6) e.password = "Min 6 characters.";

        if (!form.contactNumber.trim()) e.contactNumber = "Contact number is required.";
        else if (!/^[0-9+\-() ]{7,}$/.test(form.contactNumber.trim()))
            e.contactNumber = "Invalid phone number.";

        return e;
    }

    async function onSubmit(ev) {
        ev.preventDefault();
        const eMap = validate();
        setErrors(eMap);
        if (Object.values(eMap).some(Boolean)) return;

        try {
            setLoading(true);

            // 1) Register in identity-service (token is stored by authService)
            const auth = await authService.register(form);

            // 2) ALWAYS create/upsert personal profile
            await profileService.upsertPersonal({
                // ⚠️ Rename keys to match PersonalProfileRequest
                firstName: form.firstName,
                lastName: form.lastName,
                contactNumber: form.contactNumber,
                email: form.email,
            });

            // 3) If shopper -> done
            if (form.role === "SHOPPER") {
                navigate("/"); // or "/profile"
                return;
            }

            // 4) Otherwise go to Phase 2 (business profile)
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
        <div className="registerPage">
            <div className="registerCard">
                <h1 className="registerTitle">REGISTER</h1>

                <form className="registerForm" onSubmit={onSubmit}>
                    {errors.form && <div className="formError">{errors.form}</div>}

                    <div className="twoColRow">
                        <div className="fieldRow">
                            <label className="fieldLabel">First Name:</label>
                            <Input
                                value={form.firstName}
                                onChange={(ev) => setField("firstName", ev.target.value)}
                                error={errors.firstName}
                            />
                        </div>

                        <div className="fieldRow">
                            <label className="fieldLabel">Last Name:</label>
                            <Input
                                value={form.lastName}
                                onChange={(ev) => setField("lastName", ev.target.value)}
                                error={errors.lastName}
                            />
                        </div>
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Role:</label>
                        <div className="selectWrap">
                            <select
                                className={`select ${errors.role ? "selectError" : ""}`}
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
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Email:</label>
                        <Input
                            value={form.email}
                            onChange={(ev) => setField("email", ev.target.value)}
                            error={errors.email}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Username:</label>
                        <Input
                            value={form.username}
                            onChange={(ev) => setField("username", ev.target.value)}
                            error={errors.username}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Password:</label>
                        <Input
                            type="password"
                            value={form.password}
                            onChange={(ev) => setField("password", ev.target.value)}
                            error={errors.password}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Contact Number:</label>
                        <Input
                            value={form.contactNumber}
                            onChange={(ev) => setField("contactNumber", ev.target.value)}
                            error={errors.contactNumber}
                        />
                    </div>

                    <div className="submitRow">
                        <Button type="submit" variant="primary" className="registerBtn" disabled={loading}>
                            {loading ? "Registering..." : "Register"}
                        </Button>
                    </div>
                </form>

                <div className="registerFooter">
                    <span>Already have an account?</span>
                    <a className="loginLink" href="/login">
                        Login →
                    </a>
                </div>
            </div>
        </div>
    );
}