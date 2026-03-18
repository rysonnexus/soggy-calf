import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faShield,
  faGear,
  faDragon,
  faBookOpen,
  faLock,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function SidebarButton({ icon, label, active, onClick, locked }) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
        locked
          ? "text-tavern-muted cursor-not-allowed bg-tavern-dark/30"
          : active
            ? "bg-tavern-amber/25 text-tavern-gold"
            : "text-tavern-parchment hover:bg-tavern-amber/15"
      }`}
    >
      <span className="flex items-center justify-between">
        <span>
          <FontAwesomeIcon icon={icon} className="mr-2" />
          {label}
        </span>
        {locked && <FontAwesomeIcon icon={faLock} className="text-xs" />}
      </span>
    </button>
  );
}

export default function AdminShell({ title, children, menuRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const resolvedRole = menuRole || user?.role;

  const navItems = useMemo(
    () =>
      resolvedRole === "PLAYER"
        ? [
            { label: "Dashboard", path: "/dashboard", icon: faShield },
            { label: "Settings", path: "/settings", icon: faGear },
            {
              label: "Campaigns",
              path: "/admin/campaigns",
              icon: faBookOpen,
              locked: true,
            },
            {
              label: "Adventurers",
              path: "/admin/adventurers",
              icon: faDragon,
              locked: true,
            },
          ]
        : [
            { label: "Dashboard", path: "/admin/dashboard", icon: faShield },
            { label: "Settings", path: "/admin/settings", icon: faGear },
            {
              label: "Campaigns",
              path: "/admin/campaigns",
              icon: faBookOpen,
            },
            {
              label: "Adventurers",
              path: "/admin/adventurers",
              icon: faDragon,
            },
          ],
    [resolvedRole],
  );

  const isActiveRoute = (path) => {
    if (
      path === "/admin/dashboard" ||
      path === "/dashboard" ||
      path === "/settings" ||
      path === "/admin/settings"
    ) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const goTo = (path, locked) => {
    if (locked) return;
    setMenuOpen(false);
    navigate(path);
  };

  const panelTitle =
    resolvedRole === "PLAYER" ? "Adventurer Panel" : "Dungeon Master Panel";
  const menuTitle = resolvedRole === "PLAYER" ? "Player Menu" : "DM Menu";

  return (
    <div className="min-h-screen bg-transparent">
      {menuOpen && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 bg-black/55 z-30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-tavern-amber/25 bg-tavern-brown/95 backdrop-blur-sm p-4 transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-tavern-gold font-display font-bold">
            <FontAwesomeIcon icon={faShield} />
            <span>{menuTitle}</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="h-8 w-8 rounded border border-tavern-amber/35 text-tavern-amber hover:bg-tavern-amber/15"
            aria-label="Close sidebar"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="mb-4 rounded-md border border-tavern-amber/20 bg-tavern-dark/40 px-3 py-2">
          <p className="text-xs text-tavern-muted">Signed in as</p>
          <p className="text-sm text-tavern-parchment font-medium">
            {user?.username}
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <SidebarButton
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={isActiveRoute(item.path)}
              locked={item.locked}
              onClick={() => goTo(item.path, item.locked)}
            />
          ))}
        </nav>

        <div className="mt-6 pt-4 border-t border-tavern-amber/20">
          <SidebarButton
            icon={faArrowRightFromBracket}
            label="Leave"
            active={false}
            onClick={logout}
          />
        </div>
      </aside>

      <div className="p-4 md:p-8">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="h-10 w-10 rounded-md border border-tavern-amber/35 text-tavern-amber hover:bg-tavern-amber/15"
              aria-label="Open sidebar menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-tavern-gold">
                {panelTitle}
              </h1>
              <p className="text-tavern-muted text-sm">{title}</p>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
