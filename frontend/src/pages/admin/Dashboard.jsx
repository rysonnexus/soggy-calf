import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDragon,
  faBookOpen,
  faGear,
  faCircleNotch,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";
import AdminShell from "./AdminShell.jsx";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [playersCount, setPlayersCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [players, campaigns] = await Promise.all([
        api.get("/admin/players", { token: accessToken }),
        api.get("/admin/campaigns", { token: accessToken }),
      ]);
      setPlayersCount(players.length);
      setCampaignsCount(campaigns.length);
    } catch {
      // Keep dashboard usable even if summary fetch fails.
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="card">
          <h2 className="font-display text-xl font-bold text-tavern-gold mb-2">
            Welcome, {user?.username}
          </h2>
          <p className="text-tavern-muted text-sm">
            Manage your table, organize party members, and prepare the next
            session.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-tavern-amber/20 bg-tavern-dark/30 p-3">
              <p className="text-tavern-muted text-xs uppercase tracking-wide">
                Adventurers
              </p>
              <p className="text-tavern-parchment text-2xl font-bold mt-1">
                {loading ? (
                  <FontAwesomeIcon icon={faCircleNotch} spin />
                ) : (
                  playersCount
                )}
              </p>
            </div>
            <div className="rounded-lg border border-tavern-amber/20 bg-tavern-dark/30 p-3">
              <p className="text-tavern-muted text-xs uppercase tracking-wide">
                Campaigns
              </p>
              <p className="text-tavern-parchment text-2xl font-bold mt-1">
                {loading ? (
                  <FontAwesomeIcon icon={faCircleNotch} spin />
                ) : (
                  campaignsCount
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-display font-bold text-tavern-gold mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/admin/campaigns")}
              className="w-full rounded-lg border border-tavern-amber/30 bg-tavern-dark/40 px-4 py-3 text-left hover:bg-tavern-amber/15 transition-colors"
            >
              <FontAwesomeIcon
                icon={faBookOpen}
                className="mr-2 text-tavern-amber"
              />
              Campaigns
            </button>
            <button
              onClick={() => navigate("/admin/adventurers")}
              className="w-full rounded-lg border border-tavern-amber/30 bg-tavern-dark/40 px-4 py-3 text-left hover:bg-tavern-amber/15 transition-colors"
            >
              <FontAwesomeIcon
                icon={faDragon}
                className="mr-2 text-tavern-amber"
              />
              Adventurers
            </button>
            <button
              onClick={() => navigate("/admin/settings")}
              className="w-full rounded-lg border border-tavern-amber/30 bg-tavern-dark/40 px-4 py-3 text-left hover:bg-tavern-amber/15 transition-colors"
            >
              <FontAwesomeIcon
                icon={faGear}
                className="mr-2 text-tavern-amber"
              />
              Settings
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
