function WellnessReminder({ show, reminderType, activeTime, formatTime, onDismiss, onTakeBreak, onContinue }) {
    if (!show) return null;

    const messages = {
        '30min': {
            title: "Time for a Stretch!",
            message: "You've been browsing for 30 minutes. Your eyes and body could use a quick break.",
            suggestion: "Try looking away from the screen for 20 seconds or stretching for a minute."
        },
        '1hour': {
            title: "Hour Wellness Check",
            message: "You've been scrolling for an hour! It's time for a proper break.",
            suggestion: "Consider taking a 5-10 minute walk, grabbing some water, or stepping away from your device."
        }
    };

    const currentMessage = messages[reminderType] || messages['30min'];

    return (
        <div className="wellness-overlay">
            <div className="wellness-modal">
                <div className="wellness-header">
                    <h2>{currentMessage.title}</h2>
                    <button 
                        className="wellness-close" 
                        onClick={onDismiss}
                        aria-label="Close reminder"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="wellness-content">
                    <p className="wellness-message">{currentMessage.message}</p>
                    <p className="wellness-suggestion">{currentMessage.suggestion}</p>
                    
                    <div className="wellness-stats">
                        <span>Active time: {formatTime(activeTime)}</span>
                    </div>
                </div>
                
                <div className="wellness-actions">
                    <button 
                        className="wellness-button secondary" 
                        onClick={onContinue}
                    >
                        Continue Browsing
                    </button>
                    <button 
                        className="wellness-button primary" 
                        onClick={onTakeBreak}
                    >
                        Take a Break
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WellnessReminder;