import { useMemo, useState } from "react";
import { UserContext } from "./UserStateContext";

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("devspaceUser") || "null");
    } catch {
        return null;
    }
};

export function UserProvider({ children }) {
    const [user, setUserState] = useState(readStoredUser);

    const setUser = (nextUser) => {
        setUserState(nextUser);
        if (nextUser) {
            localStorage.setItem("devspaceUser", JSON.stringify(nextUser));
        } else {
            localStorage.removeItem("devspaceUser");
        }
    };

    const value = useMemo(() => ({ user, setUser }), [user]);
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

