import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Login from "../pages/Login.jsx";
import ChangePIN from "../pages/ChangePIN.jsx";
import AdminPlayers from "../pages/admin/Players.jsx";
import PlayerDashboard from "../pages/player/Dashboard.jsx";
import Forbidden from "../pages/Forbidden.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "DM") return <Navigate to="/forbidden" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-tavern-amber text-xl animate-pulse">
        Loading The Soggy Calf…
      </div>
    </div>
  );
}

export default function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={user.role === "DM" ? "/admin" : "/dashboard"}
              replace
            />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/change-pin"
        element={
          <PrivateRoute>
            <ChangePIN />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPlayers />
          </AdminRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <PlayerDashboard />
          </PrivateRoute>
        }
      />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
