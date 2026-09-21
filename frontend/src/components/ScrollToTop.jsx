import { useEffect, useState } from "react";

function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => setVisible(window.scrollY > 0);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            type="button"
            className={`scroll-to-top ${visible ? "is-visible" : ""}`}
            onClick={handleClick}
            aria-label="Move to top"
            tabIndex={visible ? 0 : -1}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 15 7-7 7 7" />
            </svg>
            <span>Move to Top</span>
        </button>
    );
}

export default ScrollToTop;
