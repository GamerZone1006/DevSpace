import { NavLink } from "react-router-dom";

function Sidebar({ onMessagesClick, unreadMessages }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-menu">
                {/* Home */}
                <NavLink to="/feed" end className={({ isActive }) => isActive ? 'active' : ''}>
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="nav-text">Home</span>
                </NavLink>

                <button type="button" className="sidebar-message-item" onClick={onMessagesClick}>
                    <span className="sidebar-message-icon-wrap">
                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        {unreadMessages > 0 && (
                            <span className="sidebar-message-badge" aria-label={`${unreadMessages} unread messages`}>
                                {unreadMessages > 99 ? "99+" : unreadMessages}
                            </span>
                        )}
                    </span>
                    <span className="nav-text">Messages</span>
                </button>

                {/* Reels */}
                {/* <NavLink to="/feed?tab=reels" className={({ isActive }) => isActive ? 'active' : ''}>
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span className="nav-text">Reels</span>
                </NavLink> */}

                {/* Profile */}
                <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="nav-text">Profile</span>
                </NavLink>

                {/* Learning Dashboard */}
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="7" height="9" x="3" y="3" rx="1" />
                        <rect width="7" height="5" x="14" y="3" rx="1" />
                        <rect width="7" height="9" x="14" y="12" rx="1" />
                        <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                    <span className="nav-text">Learning Dashboard</span>
                </NavLink>
            </div>
        </aside>
    );
}

export default Sidebar;