import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDragon,
  faDeleteLeft,
  faCircleNotch,
  faKey,
  faShieldHalved,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

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
      <div className="flex justify-center gap-3 my-2">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className="w-11 h-12 sm:w-12 sm:h-14 rounded-md flex items-center justify-center text-xl sm:text-2xl font-bold
              border border-[color-mix(in_srgb,var(--color-tavern-amber)_50%,transparent)]
              bg-[color-mix(in_srgb,var(--color-tavern-dark)_82%,black)] text-tavern-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            {pin[i] ? "●" : ""}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xs mx-auto">
        {digits.map((d, i) => {
          if (d === null) return <div key={i} />;
          if (d === "del") {
            return (
              <button
                key={i}
                type="button"
                onClick={onDelete}
                className="h-12 sm:h-14 rounded-lg border border-[color-mix(in_srgb,var(--color-tavern-amber)_35%,transparent)]
                  bg-[color-mix(in_srgb,var(--color-tavern-brown)_80%,black)] text-tavern-amber
                  hover:bg-[color-mix(in_srgb,var(--color-tavern-amber)_18%,var(--color-tavern-dark))]
                  transition-colors flex items-center justify-center"
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
              className="h-12 sm:h-14 rounded-lg border border-[color-mix(in_srgb,var(--color-tavern-amber)_35%,transparent)]
                bg-[color-mix(in_srgb,var(--color-tavern-brown)_80%,black)] text-tavern-parchment text-lg sm:text-xl font-semibold
                hover:bg-[color-mix(in_srgb,var(--color-tavern-amber)_18%,var(--color-tavern-dark))]
                hover:border-[color-mix(in_srgb,var(--color-tavern-amber)_75%,transparent)]
                transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
  const [usernames, setUsernames] = useState([]);
  const [usernamesLoading, setUsernamesLoading] = useState(true);
  const [usernamesError, setUsernamesError] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadUsernames = async () => {
      setUsernamesLoading(true);
      setUsernamesError("");
      try {
        const data = await api.get("/auth/usernames", { skipAuth: true });
        if (!active) return;
        setUsernames(Array.isArray(data.usernames) ? data.usernames : []);
      } catch {
        if (!active) return;
        setUsernames([]);
        setUsernamesError("Could not load usernames. Try again shortly.");
      } finally {
        if (active) setUsernamesLoading(false);
      }
    };

    loadUsernames();
    return () => {
      active = false;
    };
  }, []);

  const handleDigit = (d) => {
    if (pin.length < PIN_LENGTH) setPin((p) => p + d);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
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
    <div className="relative min-h-screen overflow-hidden px-3 py-6 sm:px-4 sm:py-8 lg:px-8 login-scene">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(240,192,64,0.3)_0%,rgba(240,192,64,0)_72%)] login-lantern" />
      <div className="pointer-events-none absolute inset-0 opacity-35 login-fog" />

      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center min-h-[calc(100svh-3rem)]">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-tavern-amber)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-tavern-brown)_82%,black)] shadow-[0_28px_70px_rgba(0,0,0,0.5)] login-panel lg:grid-cols-[1.05fr_1fr]">
          <aside className="hidden lg:flex flex-col justify-between p-8 border-r border-[color-mix(in_srgb,var(--color-tavern-amber)_20%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-tavern-dark)_88%,black)_0%,color-mix(in_srgb,var(--color-tavern-brown)_78%,black)_100%)]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-tavern-amber)_40%,transparent)] px-3 py-1 text-xs tracking-[0.12em] uppercase text-tavern-amber/90">
                <FontAwesomeIcon icon={faShieldHalved} />
                Secure Campfire Access
              </p>
              <h1 className="mt-5 font-display text-4xl leading-tight text-tavern-gold">
                The Soggy Calf
              </h1>
              <p className="mt-3 max-w-sm text-sm text-tavern-parchment/80">
                Gather your party, check your quest log, and step into the next
                chapter.
              </p>
            </div>

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-tavern-amber)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-tavern-dark)_75%,black)] px-4 py-3 text-sm text-tavern-parchment/80">
              <p className="font-semibold text-tavern-gold">Adventurer Tip</p>
              <p className="mt-1">
                Newly created accounts must change PIN on first entry.
              </p>
            </div>
          </aside>

          <div className="p-5 sm:p-7">
            <div className="mb-6 text-center lg:text-left">
              <FontAwesomeIcon
                icon={faDragon}
                className="text-tavern-amber text-3xl sm:text-4xl mb-3"
              />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-tavern-gold">
                Welcome Back
              </h2>
              <p className="text-tavern-muted text-sm mt-1">
                Sign in with your name and 4-digit PIN.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="block text-sm text-tavern-muted mb-1"
                  htmlFor="username"
                >
                  Name / Username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-tavern-muted">
                    <FontAwesomeIcon icon={faKey} />
                  </span>
                  <select
                    id="username"
                    autoFocus
                    className="input-field pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={usernamesLoading || usernames.length === 0}
                  >
                    <option value="">
                      {usernamesLoading
                        ? "Loading usernames..."
                        : "Select your username"}
                    </option>
                    {usernames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                {usernamesError && (
                  <p
                    className="mt-2 text-red-300 text-sm flex items-center gap-2"
                    role="alert"
                  >
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    {usernamesError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-tavern-muted mb-2">
                  4-Digit PIN
                </label>
                <PinPad
                  pin={pin}
                  onDigit={handleDigit}
                  onDelete={handleDelete}
                />
              </div>

              {error && (
                <p className="text-red-300 text-sm text-center" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  usernamesLoading ||
                  !username.trim() ||
                  pin.length !== PIN_LENGTH
                }
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading && <FontAwesomeIcon icon={faCircleNotch} spin />}
                Enter the Tavern
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
