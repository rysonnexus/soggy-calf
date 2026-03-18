import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDragon,
  faKey,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function PlayerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faDragon}
              className="text-tavern-amber text-2xl"
            />
            <div>
              <h1 className="font-display text-xl font-bold text-tavern-gold">
                The Soggy Calf
              </h1>
              <p className="text-tavern-muted text-sm">Adventurer's Board</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/change-pin")}
              className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faKey} /> PIN
            </button>
            <button
              onClick={logout}
              className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faSignOutAlt} /> Leave
            </button>
          </div>
        </div>

        {/* Welcome card */}
        <div className="card mb-6">
          <h2 className="font-display text-lg font-bold text-tavern-gold mb-1">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-tavern-muted text-sm">
            You have entered The Soggy Calf. Your adventure awaits.
          </p>
        </div>

        {/* Campaigns placeholder */}
        <div className="card">
          <h3 className="font-display font-bold text-tavern-gold mb-3">
            Your Campaigns
          </h3>
          <p className="text-tavern-muted text-sm text-center py-6">
            No campaigns yet. Ask your Dungeon Master to add you to one.
          </p>
        </div>
      </div>
    </div>
  );
}
