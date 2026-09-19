import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useUser } from "../context/useUser";

function Login() {
    const navigate = useNavigate();
    const { setUser } = useUser();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("devspaceToken")) {
            navigate("/feed", { replace: true });
        }
    }, [navigate]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await api.post("/auth/login", form);

            // Store token and user information securely
            localStorage.setItem("devspaceToken", response.data.token);
            setUser(response.data.user);

            navigate("/feed", { replace: true });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Welcome to DevSpace</h1>
                <p>Learn. Build. Share.</p>

                {error && <div className="auth-error">{error}</div>}

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p>
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;