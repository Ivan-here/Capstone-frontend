import { useState } from "react";
import "./login.css";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

export default function LoginPage() {
    const [form, setForm] = useState({
        login: "",
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
        if (!form.login.trim()) e.login = "Email or username is required.";
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
            navigate("/");
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
        <div className="authShell authShell--login">
            <main className="authMain">
                <div className="authHeader">
                    <div className="authHeaderCopy">
                        <h1>Welcome Back</h1>
                        <p className="authMuted">
                            Sign in to continue browsing listings, managing orders, and handling pickups.
                        </p>
                    </div>
                    <button onClick={() => navigate(-1)} className="authBackLink">
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <form className="authCard" onSubmit={onSubmit}>
                    {errors.form && <div className="formError">{errors.form}</div>}

                    <div className="authSection">
                        <div className="authSectionTitle"><Mail size={18} /> Account Access</div>
                        <div className="authInputRow authInputRow--single">
                            <Input
                                label="Email or username"
                                value={form.login}
                                onChange={(e) => setField("login", e.target.value)}
                                error={errors.login}
                                placeholder="Enter your email or username"
                            />
                        </div>
                        <div className="authInputRow authInputRow--single">
                            <Input
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setField("password", e.target.value)}
                                error={errors.password}
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    <div className="authActions">
                        <Button type="submit" variant="primary" className="authPrimaryBtn" disabled={loading}>
                            {loading ? "Logging in..." : "Log In"}
                        </Button>
                        <div className="authFooter">
                            <span>Don&apos;t have an account?</span>
                            <Link className="authInlineLink" to="/register">
                                Register now
                            </Link>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
