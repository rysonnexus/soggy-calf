import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDragon,
  faDeleteLeft,
  faCircleNotch,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext.jsx";

const PIN_LENGTH = 4;

function PinPad({ pin, onDigit, onDelete }) {
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

  return (
    <div className="space-y-4">
      {/* PIN display */}
      <div className="flex justify-center gap-3 my-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className="w-12 h-14 border-2 rounded flex items-center justify-center text-2xl font-bold transition-colors duration-150
              border-tavern-amber/40 bg-tavern-dark text-tavern-gold"
          >
            {pin[i] ? "●" : ""}
          </div>
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {digits.map((d, i) => {
          if (d === null) return <div key={i} />;
          if (d === "del") {
            return (
              <button
                key={i}
                type="button"
                onClick={onDelete}
                className="h-14 rounded-lg bg-tavern-brown border border-tavern-amber/30 text-tavern-amber hover:bg-tavern-amber/20 transition-colors flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faDeleteLeft} size="lg" />
              </button>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDigit(d)}
              disabled={pin.length >= PIN_LENGTH}
              className="h-14 rounded-lg bg-tavern-brown border border-tavern-amber/30 text-tavern-parchment text-xl font-semibold
                hover:bg-tavern-amber/20 hover:border-tavern-amber transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  const handleDigit = (d) => {
    if (pin.length < PIN_LENGTH) setPin((p) => p + d);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      usernameRef.current?.focus();
      return;
    }
    if (pin.length !== PIN_LENGTH) return;

    setError("");
    setLoading(true);
    try {
      const user = await login(username.trim(), pin);
      if (user.mustChangePIN) {
        navigate("/change-pin", { replace: true });
      } else {
        navigate(user.role === "DM" ? "/admin" : "/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      setPin("");
      if (err.status === 423) {
        setError("Account is locked. Contact your Dungeon Master.");
      } else if (err.status === 401) {
        setError("Incorrect username or PIN. Please try again.");
      } else {
        setError("Something went wrong. Try again shortly.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <FontAwesomeIcon
            icon={faDragon}
            className="text-tavern-amber text-4xl mb-3"
          />
          <h1 className="font-display text-2xl font-bold text-tavern-gold">
            The Soggy Calf
          </h1>
          <p className="text-tavern-muted text-sm mt-1">
            Welcome, adventurer. Enter your credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label
              className="block text-sm text-tavern-muted mb-1"
              htmlFor="username"
            >
              Name / Username
            </label>
            <input
              id="username"
              ref={usernameRef}
              type="text"
              autoComplete="username"
              autoFocus
              className="input-field"
              placeholder="e.g. dm or thorgrim"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
            />
          </div>

          {/* PIN pad */}
          <div>
            <label className="block text-sm text-tavern-muted mb-1">
              4-Digit PIN
            </label>
            <PinPad pin={pin} onDigit={handleDigit} onDelete={handleDelete} />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim() || pin.length !== PIN_LENGTH}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <FontAwesomeIcon icon={faCircleNotch} spin />}
            Enter the Tavern
          </button>
        </form>
      </div>
    </div>
  );
}
