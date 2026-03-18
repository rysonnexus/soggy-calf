import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <FontAwesomeIcon icon={faBan} className="text-red-500 text-5xl mb-4" />
      <h1 className="font-display text-2xl font-bold text-tavern-gold mb-2">
        Access Denied
      </h1>
      <p className="text-tavern-muted mb-6">
        You don't have permission to enter this chamber.
      </p>
      <button onClick={() => navigate(-1)} className="btn-secondary">
        Go Back
      </button>
    </div>
  );
}
