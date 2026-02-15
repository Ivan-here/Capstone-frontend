import { useState } from "react";
import "./login.css";

import Button from "@/components/layout/Button";
import Input from "@/components/layout/Input";
import { authService } from "@/services/auth.service";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [form, setForm] = useState({
        identifier: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function setField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null, form: null }));
    }

    function validate() {
        const e = {};
        if (!form.identifier.trim()) e.identifier = "Email or username is required.";
        if (!form.password) e.password = "Password is required.";
        return e;
    }

    async function onSubmit(ev) {
        ev.preventDefault();
        const eMap = validate();
        setErrors(eMap);
        if (Object.values(eMap).some(Boolean)) return;

        try {
            setLoading(true);
            await authService.login(form);
            navigate("/"); // or wherever your app goes after login
        } catch (err) {
            setErrors((prev) => ({
                ...prev,
                form: err.message || "Login failed",
            }));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="loginPage">
            <div className="loginCard">
                <h1 className="loginTitle">LOGIN</h1>

                <form className="loginForm" onSubmit={onSubmit}>
                    {errors.form && <div className="formError">{errors.form}</div>}

                    <div className="fieldRow">
                        <label className="fieldLabel">Email / Username:</label>
                        <Input
                            value={form.identifier}
                            onChange={(e) => setField("identifier", e.target.value)}
                            error={errors.identifier}
                        />
                    </div>

                    <div className="fieldRow">
                        <label className="fieldLabel">Password:</label>
                        <Input
                            type="password"
                            value={form.password}
                            onChange={(e) => setField("password", e.target.value)}
                            error={errors.password}
                        />
                    </div>

                    <div className="submitRow">
                        <Button type="submit" variant="primary" className="loginBtn" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </div>
                </form>

                <div className="loginFooter">
                    <span>Don’t have an account?</span>
                    <a className="registerLink" href="/register">
                        Register →
                    </a>
                </div>
            </div>
        </div>
    );
}
