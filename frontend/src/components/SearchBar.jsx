import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true);
                try {
                    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
                    setResults(response.data);
                    setShowDropdown(true);
                } catch (error) {
                    console.error("Search error:", error);
                    setResults(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults(null);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [query]);

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
        setShowDropdown(false);
        setQuery("");
    };

    const handleTagClick = (tag) => {
        navigate(`/feed?tab=for-you&q=${encodeURIComponent(tag)}`);
        setShowDropdown(false);
        setQuery("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/feed?tab=for-you&q=${encodeURIComponent(query)}`);
            setShowDropdown(false);
        }
    };

    return (
        <div className="search-container" ref={searchRef}>
            <form onSubmit={handleSubmit} className="search-form">
                <input
                    type="text"
                    placeholder="Search developers, topics..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="search-input"
                />
            </form>

            {showDropdown && (loading || results) && (
                <div className="search-dropdown">
                    {loading ? (
                        <div className="search-loading">Searching...</div>
                    ) : results && (
                        <>
                            {results.users?.length > 0 && (
                                <div className="search-section">
                                    <div className="search-section-title">Developers</div>
                                    {results.users.map((user) => (
                                        <div
                                            key={user._id}
                                            className="search-result-item"
                                            onClick={() => handleUserClick(user._id)}
                                        >
                                            <div className="search-result-avatar">
                                                {user.profilePicture ? (
                                                    <img src={user.profilePicture} alt={user.username} />
                                                ) : (
                                                    <span>{user.name?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="search-result-info">
                                                <div className="search-result-name">{user.username}</div>
                                                <div className="search-result-sub">{user.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.technologyTags?.length > 0 && (
                                <div className="search-section">
                                    <div className="search-section-title">Technologies</div>
                                    <div className="search-tags">
                                        {results.technologyTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="search-tag"
                                                onClick={() => handleTagClick(tag)}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.users?.length === 0 && results.technologyTags?.length === 0 && (
                                <div className="search-no-results">No results found</div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchBar;