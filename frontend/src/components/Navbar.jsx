import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useUser } from "../context/useUser";

function Navbar() {
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    const handleLogout = () => {
        localStorage.removeItem("devspaceToken");
        setUser(null);
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <Link to="/feed" className="navbar-logo">DevSpace <p>Learn. Build. Share.</p>
            </Link>
            

            <div className="navbar-search">
                <SearchBar />
            </div>

            <div className="navbar-actions">
                {/* <Link to="/dashboard">Dashboard</Link> */}

                {user && (
                    <Link to={user._id || user.id ? `/profile/${user._id || user.id}` : "/profile"} className="navbar-profile">
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.username} className="navbar-avatar" />
                        ) : (
                            <span className="navbar-avatar-fallback">
                                {user.name?.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </Link>
                )}

                <button onClick={handleLogout}>Log Out</button>
            </div>
        </nav>
    );
}

export default Navbar;