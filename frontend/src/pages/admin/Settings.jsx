import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faKey } from "@fortawesome/free-solid-svg-icons";
import AdminShell from "./AdminShell.jsx";
import PinChangeCard from "../../components/PinChangeCard.jsx";

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState(null);
  const [notice, setNotice] = useState("");

  const handlePinComplete = () => {
    setActiveSection(null);
    setNotice("PIN updated successfully.");
  };

  return (
    <AdminShell title="Settings">
      {activeSection === "pin" ? (
        <div className="max-w-md">
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            className="mb-4 text-sm text-tavern-muted hover:text-tavern-parchment"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
            Back to settings
          </button>
          <PinChangeCard
            subtitle="Update the Dungeon Master login PIN."
            onComplete={handlePinComplete}
          />
        </div>
      ) : (
        <>
          {notice && (
            <p className="mb-3 text-sm text-green-400" role="status">
              {notice}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
            <button
              onClick={() => {
                setNotice("");
                setActiveSection("pin");
              }}
              className="rounded-lg border border-tavern-amber/30 bg-tavern-dark/40 px-4 py-4 text-left hover:bg-tavern-amber/15 transition-colors"
            >
              <p className="text-tavern-parchment font-semibold">
                <FontAwesomeIcon
                  icon={faKey}
                  className="mr-2 text-tavern-amber"
                />
                PIN
              </p>
              <p className="text-xs text-tavern-muted mt-1">
                Update the Dungeon Master login PIN.
              </p>
            </button>
          </div>
        </>
      )}
    </AdminShell>
  );
}
