import { useEffect, useState } from "react";

const STORAGE_KEY = "devspace-feed-background-theme";
const themes = [
    { id: "default", label: "Default", detail: "Solid black" },
    { id: "doodles", label: "Doodles", detail: "Code, gears and formulas" },
    { id: "grey", label: "Solid Grey", detail: "Graphite" },
    { id: "navy", label: "Dark Navy Blue", detail: "Night blue" },
    { id: "purple", label: "Darkest Purple", detail: "Deep violet" }
];

const getInitialTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return themes.some((theme) => theme.id === stored) ? stored : "default";
};

function FeedThemeCustomizer({ onThemeChange }) {
    const [theme, setTheme] = useState(getInitialTheme);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, theme);
        onThemeChange(theme);
    }, [onThemeChange, theme]);

    return (
        <div className={`feed-theme-customizer ${open ? "is-open" : ""}`}>
            <div className="feed-theme-drawer" aria-hidden={!open}>
                <div className="feed-theme-heading">
                    <span>FEED APPEARANCE</span>
                    <strong>Choose a background</strong>
                </div>
                <div className="feed-theme-options" role="radiogroup" aria-label="Feed background theme">
                    {themes.map((option) => (
                        <button
                            type="button"
                            key={option.id}
                            className={`feed-theme-option feed-theme-option-${option.id} ${theme === option.id ? "selected" : ""}`}
                            role="radio"
                            aria-checked={theme === option.id}
                            onClick={() => {
                                setTheme(option.id);
                                setOpen(false);
                            }}
                        >
                            <span className="feed-theme-swatch" aria-hidden="true" />
                            <span>
                                <strong>{option.label}</strong>
                                <small>{option.detail}</small>
                            </span>
                            {theme === option.id && <b aria-hidden="true">✓</b>}
                        </button>
                    ))}
                </div>
            </div>
            <button
                type="button"
                className="feed-theme-toggle"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                aria-label={open ? "Close feed background themes" : "Customize feed background"}
                title="Customize feed background"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m14.7 6.3 3 3M4 20l4.1-1 10.2-10.2a2.12 2.12 0 0 0-3-3L5.1 16 4 20Z" />
                    <path d="m13 8 3 3" />
                </svg>
            </button>
        </div>
    );
}

export default FeedThemeCustomizer;
