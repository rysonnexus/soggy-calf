import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faPlus,
  faCircleNotch,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";
import AdminShell from "./AdminShell.jsx";

export default function AdminCampaigns() {
  const { accessToken } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/campaigns", { token: accessToken });
      setCampaigns(data);
    } catch {
      setError("Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    try {
      const created = await api.post(
        "/admin/campaigns",
        {
          name: name.trim(),
          description: description.trim(),
        },
        { token: accessToken },
      );

      setCampaigns((prev) => [created, ...prev]);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err.message || "Failed to create campaign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Campaigns">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="card">
          <h2 className="font-display font-bold text-tavern-gold text-lg mb-4">
            <FontAwesomeIcon icon={faPlus} className="mr-2 text-tavern-amber" />
            Create Campaign
          </h2>
          <form onSubmit={handleCreateCampaign} className="space-y-3">
            <div>
              <label className="block text-sm text-tavern-muted mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shadows Over Briarhold"
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-sm text-tavern-muted mb-1">
                Description (optional)
              </label>
              <textarea
                className="input-field min-h-28 resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary of your campaign premise"
                maxLength={500}
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {saving && <FontAwesomeIcon icon={faCircleNotch} spin />}
              Create Campaign
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-tavern-gold text-lg mb-4">
            <FontAwesomeIcon
              icon={faBookOpen}
              className="mr-2 text-tavern-amber"
            />
            Your Campaigns ({campaigns.length})
          </h2>

          {loading ? (
            <p className="text-tavern-muted py-6 text-center">
              <FontAwesomeIcon icon={faCircleNotch} spin className="mr-2" />
              Loading campaigns...
            </p>
          ) : campaigns.length === 0 ? (
            <p className="text-tavern-muted py-6 text-center">
              No campaigns yet. Create your first campaign.
            </p>
          ) : (
            <div className="space-y-3 max-h-[28rem] overflow-auto pr-1">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-lg border border-tavern-amber/20 bg-tavern-dark/30 p-3"
                >
                  <p className="text-tavern-parchment font-semibold">
                    {campaign.name}
                  </p>
                  {campaign.description ? (
                    <p className="text-sm text-tavern-muted mt-1 whitespace-pre-wrap">
                      {campaign.description}
                    </p>
                  ) : (
                    <p className="text-sm text-tavern-muted mt-1 italic">
                      No description
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
