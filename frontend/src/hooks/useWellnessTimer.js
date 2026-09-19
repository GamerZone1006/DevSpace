import { useState, useEffect, useRef, useCallback } from "react";

function useWellnessTimer() {
    const [showReminder, setShowReminder] = useState(false);
    const [reminderType, setReminderType] = useState(null); // '30min' or '1hour'
    const [activeTime, setActiveTime] = useState(0);
    
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const lastActiveTimeRef = useRef(Date.now());
    const reminderShownRef = useRef({ '30min': false, '1hour': false });

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setActiveTime(0);
        startTimeRef.current = null;
        lastActiveTimeRef.current = Date.now();
        reminderShownRef.current = { '30min': false, '1hour': false };
    }, []);

    const handleUserActivity = useCallback(() => {
        lastActiveTimeRef.current = Date.now();
        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
        }
    }, []);

    const dismissReminder = useCallback(() => {
        setShowReminder(false);
        setReminderType(null);
    }, []);

    const takeBreak = useCallback(() => {
        dismissReminder();
        resetTimer();
    }, [dismissReminder, resetTimer]);

    const continueBrowsing = useCallback(() => {
        dismissReminder();
        lastActiveTimeRef.current = Date.now();
    }, [dismissReminder]);

    useEffect(() => {
        const activityEvents = ['scroll', 'mousedown', 'keydown', 'touchstart', 'click'];
        
        activityEvents.forEach(event => {
            window.addEventListener(event, handleUserActivity);
        });

        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
        };
    }, [handleUserActivity]);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActiveTimeRef.current;
            
            // If user has been inactive for more than 5 minutes, reset the timer
            if (timeSinceLastActivity > 5 * 60 * 1000) {
                resetTimer();
                return;
            }

            if (startTimeRef.current) {
                const totalActiveTime = now - startTimeRef.current;
                setActiveTime(totalActiveTime);

                const thirtyMinutes = 30 * 60 * 1000;
                const oneHour = 60 * 60 * 1000;

                // Show 30-minute reminder
                if (totalActiveTime >= thirtyMinutes && !reminderShownRef.current['30min']) {
                    reminderShownRef.current['30min'] = true;
                    setReminderType('30min');
                    setShowReminder(true);
                }

                // Show 1-hour reminder
                if (totalActiveTime >= oneHour && !reminderShownRef.current['1hour']) {
                    reminderShownRef.current['1hour'] = true;
                    setReminderType('1hour');
                    setShowReminder(true);
                }
            }
        }, 1000); // Check every second

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [resetTimer]);

    const formatTime = (ms) => {
        const minutes = Math.floor(ms / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    return {
        showReminder,
        reminderType,
        activeTime,
        formatTime,
        dismissReminder,
        takeBreak,
        continueBrowsing
    };
}

export default useWellnessTimer;