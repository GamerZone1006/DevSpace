import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("devspaceToken");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;