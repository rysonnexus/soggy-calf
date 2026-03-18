import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDragon,
  faPlus,
  faLock,
  faLockOpen,
  faKey,
  faTrash,
  faCircleNotch,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";

const PIN_LENGTH = 4;

function CreatePlayerModal({ onClose, onCreated, accessToken }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const digits = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    null,
    "0",
    "del",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || pin.length !== PIN_LENGTH) return;
    setError("");
    setLoading(true);
    try {
      const player = await api.post(
        "/admin/players",
        { username: username.trim(), pin },
        { token: accessToken },
      );
      onCreated(player);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create player.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm">
        <h2 className="font-display text-lg font-bold text-tavern-gold mb-4">
          Add New Adventurer
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-tavern-muted mb-1">
              Username
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. thorgrim"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-tavern-muted mb-1">
              Starting PIN
            </label>
            <div className="flex justify-center gap-2 my-2">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-12 border-2 rounded flex items-center justify-center text-xl font-bold border-tavern-amber/40 bg-tavern-dark text-tavern-gold"
                >
                  {pin[i] ? "●" : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {digits.map((d, i) => {
                if (d === null) return <div key={i} />;
                if (d === "del") {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPin((p) => p.slice(0, -1))}
                      className="h-12 rounded bg-tavern-dark border border-tavern-amber/30 text-tavern-amber hover:bg-tavern-amber/20 transition-colors flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setPin((p) => (p.length < PIN_LENGTH ? p + d : p))
                    }
                    disabled={pin.length >= PIN_LENGTH}
                    className="h-12 rounded bg-tavern-dark border border-tavern-amber/30 text-tavern-parchment text-lg font-semibold hover:bg-tavern-amber/20 transition-colors disabled:opacity-40"
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="text-tavern-muted text-xs text-center mt-1">
              Player will be prompted to change this on first login.
            </p>
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || !username.trim() || pin.length !== PIN_LENGTH
              }
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading && <FontAwesomeIcon icon={faCircleNotch} spin />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPlayers() {
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // playerId being actioned

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await api.get("/admin/players", { token: accessToken });
      setPlayers(data);
    } catch {
      // handle silently — will show empty list
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleToggleLock = async (player) => {
    setActionLoading(player.id);
    try {
      const updated = await api.patch(
        `/admin/players/${player.id}`,
        { isLocked: !player.isLocked },
        { token: accessToken },
      );
      setPlayers((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPIN = async (player) => {
    const newPin = prompt(`Enter new 4-digit PIN for ${player.username}:`);
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      alert("PIN must be exactly 4 digits.");
      return;
    }
    setActionLoading(player.id);
    try {
      await api.patch(
        `/admin/players/${player.id}`,
        { pin: newPin },
        { token: accessToken },
      );
      alert(
        `PIN reset for ${player.username}. They will be prompted to change it on next login.`,
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (player) => {
    if (
      !confirm(
        `Remove ${player.username} from the tavern? This cannot be undone.`,
      )
    )
      return;
    setActionLoading(player.id);
    try {
      await api.delete(`/admin/players/${player.id}`, { token: accessToken });
      setPlayers((ps) => ps.filter((p) => p.id !== player.id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon
            icon={faShield}
            className="text-tavern-amber text-2xl"
          />
          <div>
            <h1 className="font-display text-xl font-bold text-tavern-gold">
              Dungeon Master Panel
            </h1>
            <p className="text-tavern-muted text-sm">The Soggy Calf</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-tavern-muted text-sm hidden sm:inline">
            Welcome, {user?.username}
          </span>
          <button
            onClick={() => navigate("/change-pin")}
            className="btn-secondary text-sm py-1 px-3"
          >
            <FontAwesomeIcon icon={faKey} className="mr-1" /> PIN
          </button>
          <button onClick={logout} className="btn-secondary text-sm py-1 px-3">
            Leave
          </button>
        </div>
      </div>

      {/* Players section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-tavern-gold text-lg">
            <FontAwesomeIcon
              icon={faDragon}
              className="mr-2 text-tavern-amber"
            />
            Adventurers ({players.length})
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1"
          >
            <FontAwesomeIcon icon={faPlus} /> Add
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-tavern-muted">
            <FontAwesomeIcon icon={faCircleNotch} spin className="mr-2" />
            Loading adventurers…
          </div>
        ) : players.length === 0 ? (
          <p className="text-tavern-muted text-center py-8">
            No adventurers yet. Add the first one!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tavern-amber/20 text-tavern-muted text-left">
                  <th className="pb-2 pr-4">Username</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Failed Attempts</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-tavern-amber/10 hover:bg-tavern-amber/5"
                  >
                    <td className="py-2 pr-4 font-medium text-tavern-parchment">
                      {p.username}
                    </td>
                    <td className="py-2 pr-4">
                      {p.isLocked ? (
                        <span className="text-red-400 flex items-center gap-1">
                          <FontAwesomeIcon icon={faLock} /> Locked
                        </span>
                      ) : (
                        <span className="text-green-400 flex items-center gap-1">
                          <FontAwesomeIcon icon={faLockOpen} /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-tavern-muted">
                      {p.failedAttempts}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleLock(p)}
                          disabled={actionLoading === p.id}
                          title={p.isLocked ? "Unlock" : "Lock"}
                          className="text-tavern-amber hover:text-tavern-gold transition-colors disabled:opacity-40"
                        >
                          <FontAwesomeIcon
                            icon={p.isLocked ? faLockOpen : faLock}
                          />
                        </button>
                        <button
                          onClick={() => handleResetPIN(p)}
                          disabled={actionLoading === p.id}
                          title="Reset PIN"
                          className="text-tavern-amber hover:text-tavern-gold transition-colors disabled:opacity-40"
                        >
                          <FontAwesomeIcon icon={faKey} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={actionLoading === p.id}
                          title="Remove player"
                          className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreatePlayerModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => setPlayers((ps) => [...ps, p])}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
