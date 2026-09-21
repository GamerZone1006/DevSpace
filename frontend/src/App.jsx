import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";
import { useState, useEffect } from "react";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Loader from "./components/Loader";
import { UserProvider } from "./context/UserContext";
import { FollowerNotificationProvider } from "./context/FollowerNotificationContext";
import { ModerationNotificationProvider } from "./context/ModerationNotificationContext";

function ProtectedPage({ children }) {
    return (
        <ProtectedRoute>
            <AppLayout>
                {children}
            </AppLayout>
        </ProtectedRoute>
    );
}

function App() {
    const [appLoading, setAppLoading] = useState(true);

    useEffect(() => {
        // Simulate initial app startup / token check
        const timer = setTimeout(() => {
            setAppLoading(false);
        }, 1200); // Adjust duration or replace with your actual auth check

        return () => clearTimeout(timer);
    }, []);

    if (appLoading) {
        return (
            <div style={{ 
                background: "#000000", 
                height: "100vh", 
                width: "100vw", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center" 
            }}>
                <Loader text="LOADING..." />
            </div>
        );
    }

    return (
        <UserProvider>
                <FollowerNotificationProvider>
                    <ModerationNotificationProvider>
                        <BrowserRouter>
                            <Routes>
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/feed"
                        element={
                            <ProtectedPage>
                                <Feed />
                            </ProtectedPage>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedPage>
                                <Profile />
                            </ProtectedPage>
                        }
                    />
                    <Route
                        path="/profile/:userId"
                        element={
                            <ProtectedPage>
                                <Profile />
                            </ProtectedPage>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedPage>
                                <Dashboard />
                            </ProtectedPage>
                        }
                    />
                            </Routes>
                        </BrowserRouter>
                    </ModerationNotificationProvider>
                </FollowerNotificationProvider>
        </UserProvider>
    );
}

export default App;