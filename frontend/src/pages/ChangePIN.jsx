import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AdminShell from "./admin/AdminShell.jsx";
import PinChangeCard from "../components/PinChangeCard.jsx";

export default function ChangePIN() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const pinForm = (
    <PinChangeCard
      subtitle={
        user?.mustChangePIN
          ? "You must set a new PIN before entering the tavern."
          : "Update your 4-digit PIN."
      }
      onComplete={() =>
        navigate(user.role === "DM" ? "/admin/dashboard" : "/settings", {
          replace: true,
        })
      }
    />
  );

  const showSidebar = !user?.mustChangePIN;

  if (showSidebar) {
    return (
      <AdminShell title="Change PIN" menuRole={user?.role}>
        <div className="flex flex-col items-center justify-center px-3 py-6 sm:p-4">
          {pinForm}
        </div>
      </AdminShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 py-6 sm:p-4">
      {pinForm}
    </div>
  );
}
