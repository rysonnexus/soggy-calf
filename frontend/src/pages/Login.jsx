import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDragon,
  faDeleteLeft,
  faCircleNotch,
  faChevronDown,
  faKey,
  faUserSecret,
  faShieldHalved,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

const PIN_LENGTH = 4;
const USERNAME_FETCH_MAX_ATTEMPTS = 20;
const USERNAME_FETCH_RETRY_DELAY_MS = 1000;

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
              border border-[color-mix(in_srgb,var(--color-tavern-gold)_58%,rgba(84,138,255,0.45))]
              bg-[linear-gradient(180deg,rgba(9,26,63,0.88)_0%,rgba(7,20,50,0.86)_100%)] text-tavern-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
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
                className="h-12 sm:h-14 rounded-lg border border-[color-mix(in_srgb,var(--color-tavern-gold)_52%,rgba(84,138,255,0.45))]
                  bg-[linear-gradient(180deg,rgba(10,30,74,0.9)_0%,rgba(7,20,52,0.88)_100%)] text-tavern-gold
                  hover:bg-[linear-gradient(180deg,rgba(18,47,109,0.94)_0%,rgba(10,29,74,0.92)_100%)]
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
              className="h-12 sm:h-14 rounded-lg border border-[color-mix(in_srgb,var(--color-tavern-gold)_52%,rgba(84,138,255,0.45))]
                bg-[linear-gradient(180deg,rgba(10,30,74,0.9)_0%,rgba(7,20,52,0.88)_100%)] text-tavern-parchment text-lg sm:text-xl font-semibold
                hover:bg-[linear-gradient(180deg,rgba(18,47,109,0.94)_0%,rgba(10,29,74,0.92)_100%)]
                hover:border-[color-mix(in_srgb,var(--color-tavern-gold)_78%,rgba(84,138,255,0.42))]
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
  const [usernameMenuOpen, setUsernameMenuOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const usernameMenuRef = useRef(null);

  const formatDisplayName = (name) =>
    name === "dm" ? "Dungeon Master" : name;

  useEffect(() => {
    let active = true;
    document.body.classList.add("login-scroll-lock");

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const loadUsernames = async () => {
      setUsernamesLoading(true);
      setUsernamesError("");
      try {
        let data = null;

        for (
          let attempt = 1;
          attempt <= USERNAME_FETCH_MAX_ATTEMPTS;
          attempt += 1
        ) {
          try {
            data = await api.get("/auth/usernames", { skipAuth: true });
            break;
          } catch (err) {
            const isRetryable = !err.status || err.status >= 500;
            if (!isRetryable || attempt === USERNAME_FETCH_MAX_ATTEMPTS) {
              throw err;
            }

            await delay(USERNAME_FETCH_RETRY_DELAY_MS);
            if (!active) return;
          }
        }

        if (!active) return;
        setUsernames(Array.isArray(data?.usernames) ? data.usernames : []);
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
      document.body.classList.remove("login-scroll-lock");
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!usernameMenuRef.current?.contains(event.target)) {
        setUsernameMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setUsernameMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleDigit = (d) => {
    if (pin.length < PIN_LENGTH) setPin((p) => p + d);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const usernameFieldDisabled = usernamesLoading || usernames.length === 0;

  const usernameDisplayText = usernamesLoading
    ? "Loading usernames..."
    : username
      ? formatDisplayName(username)
      : "Select your username";

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
    <div className="relative h-dvh overflow-hidden p-3 sm:p-4 lg:p-6 login-scene">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(240,192,64,0.3)_0%,rgba(240,192,64,0)_72%)] login-lantern" />
      <div className="pointer-events-none absolute inset-0 opacity-35 login-fog" />

      <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-tavern-amber)_35%,transparent)] shadow-[0_28px_70px_rgba(0,0,0,0.5)] login-panel lg:grid-cols-[1.05fr_1fr]">
          <aside className="hidden lg:flex flex-col justify-between p-8 border-r border-[color-mix(in_srgb,var(--color-tavern-amber)_20%,transparent)] login-panel-aside">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-tavern-amber)_40%,transparent)] px-3 py-1 text-xs tracking-[0.12em] uppercase text-tavern-amber/90">
                <FontAwesomeIcon icon={faShieldHalved} />
                Secure Campfire Access
              </p>
              <div className="mt-5 login-campaign-lockup">
                <img
                  src="/images/waterdeep-gold.webp"
                  alt="Waterdeep crest"
                  className="login-campaign-seal"
                />
                <h1 className="login-campaign-main">
                  Waterdeep
                </h1>
                <h2 className="login-campaign-sub">
                  Dragon Heist
                </h2>
                <span className="login-campaign-divider" aria-hidden="true" />
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-tavern-parchment/85">
                In the City of Splendors, the high-arcanists have vanished,
                magic is fracturing, and a shadow of martial law has fallen
                over the streets. Under the iron grip of Open Lord Calloway and
                his ruthless Inquisition, the Great Game for a hidden cache of
                500,000 gold dragons has turned from a whispered rumor into a
                desperate race for survival. As a crew of specialists operating
                in a city pushed to the breaking point, you must navigate
                warring criminal syndicates and a crumbling social order to pull
                off the ultimate heist-before the city's new masters, or the
                monsters in the dark, find the vault first.
              </p>
            </div>

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-tavern-gold)_42%,rgba(84,138,255,0.4))] bg-[linear-gradient(165deg,rgba(8,24,60,0.75)_0%,rgba(5,16,40,0.7)_100%)] px-4 py-3 text-sm text-tavern-parchment/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
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
              <p className="text-tavern-parchment/90 text-sm mt-1">
                Sign in with your character and 4-digit PIN.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="block text-sm text-tavern-parchment/90 mb-1"
                  htmlFor="username-trigger"
                >
                  Character selection
                </label>
                <div className="relative" ref={usernameMenuRef}>
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-tavern-muted">
                    <FontAwesomeIcon
                      icon={username === "dm" ? faUserSecret : faKey}
                    />
                  </span>
                  <button
                    id="username-trigger"
                    type="button"
                    autoFocus
                    className="login-select w-full pl-10 pr-10 text-left"
                    onClick={() => {
                      if (!usernameFieldDisabled) {
                        setUsernameMenuOpen((open) => !open);
                      }
                    }}
                    disabled={usernameFieldDisabled}
                    aria-haspopup="listbox"
                    aria-expanded={usernameMenuOpen}
                    aria-controls="username-listbox"
                  >
                    {usernameDisplayText}
                  </button>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-tavern-gold/90">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </span>

                  {usernameMenuOpen && !usernameFieldDisabled && (
                    <ul
                      id="username-listbox"
                      role="listbox"
                      className="login-select-menu"
                    >
                      {usernames.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            className="login-select-option"
                            onClick={() => {
                              setUsername(name);
                              setUsernameMenuOpen(false);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={name === "dm" ? faUserSecret : faKey}
                              className="text-tavern-gold/90"
                            />
                            <span>{formatDisplayName(name)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
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
                <label className="block text-sm text-tavern-parchment/90 mb-2">
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
                className="w-full flex items-center justify-center gap-2 rounded-md min-h-11 font-semibold text-[var(--color-tavern-dark)] bg-[linear-gradient(180deg,var(--color-tavern-gold)_0%,var(--color-tavern-amber)_100%)] shadow-[0_10px_24px_rgba(4,12,32,0.45)] transition-all hover:brightness-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading && <FontAwesomeIcon icon={faCircleNotch} spin />}
                Enter the Yawning Portal
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
