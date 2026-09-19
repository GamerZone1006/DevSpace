import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const availableInterests = [
    "javascript",
    "react",
    "nodejs",
    "python",
    "java",
    "mongodb",
    "sql",
    "dsa",
    "machine learning",
    "web development"
];

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: ""
    });

    const [interests, setInterests] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const toggleInterest = (interest) => {
        setInterests((current) =>
            current.includes(interest)
                ? current.filter((item) => item !== interest)
                : [...current, interest]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (interests.length === 0) {
            setError("Select at least one interest");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await api.post("/auth/register", {
                ...form,
                interests
            });

            navigate("/login");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Join DevSpace</h1>
                <p>Create your developer profile</p>

                {error && <div className="auth-error">{error}</div>}

                <input
                    name="name"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <input
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                />

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

                <h3>Your tech stacks</h3>
                <p>These rank your For You feed. You can still view and post anything.</p>

                <div className="interest-list">
                    {availableInterests.map((interest) => (
                        <button
                            type="button"
                            key={interest}
                            className={
                                interests.includes(interest)
                                    ? "interest selected"
                                    : "interest"
                            }
                            onClick={() => toggleInterest(interest)}
                        >
                            {interest}
                        </button>
                    ))}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                </button>

                <p>
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;