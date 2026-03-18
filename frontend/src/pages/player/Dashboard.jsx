import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDragon } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminShell from "../admin/AdminShell.jsx";

export default function PlayerDashboard() {
  const { user } = useAuth();

  return (
    <AdminShell title="Dashboard" menuRole="PLAYER">
      <div className="max-w-2xl mx-auto">
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
            <FontAwesomeIcon
              icon={faDragon}
              className="mr-2 text-tavern-amber"
            />
            Your Campaigns
          </h3>
          <p className="text-tavern-muted text-sm text-center py-6">
            No campaigns yet. Ask your Dungeon Master to add you to one.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
