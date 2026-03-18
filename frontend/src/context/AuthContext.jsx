/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);
export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Schedule silent token refresh 1 minute before expiry
  const scheduleRefresh = useCallback((expiresInSeconds) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max((expiresInSeconds - 60) * 1000, 5000);
    refreshTimerRef.current = setTimeout(() => silentRefresh(), delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const silentRefresh = useCallback(async () => {
    try {
      const data = await api.post("/auth/refresh", {}, { skipAuth: true });
      setAccessToken(data.accessToken);
      setUser(data.user);
      scheduleRefresh(data.expiresIn);
    } catch {
      // Refresh token expired or revoked — clear session
      setAccessToken(null);
      setUser(null);
    }
  }, [scheduleRefresh]);

  // On mount, attempt silent refresh to restore session from httpOnly cookie
  useEffect(() => {
    silentRefresh().finally(() => setLoading(false));
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [silentRefresh]);

  const login = useCallback(
    async (username, pin) => {
      const data = await api.post(
        "/auth/login",
        { username, pin },
        { skipAuth: true },
      );
      setAccessToken(data.accessToken);
      setUser(data.user);
      scheduleRefresh(data.expiresIn);
      return data.user;
    },
    [scheduleRefresh],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {}, { token: accessToken });
    } catch {
      // Best-effort logout
    } finally {
      setAccessToken(null);
      setUser(null);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }
  }, [accessToken]);

  const value = {
    user,
    accessToken,
    login,
    logout,
    loading,
    isAdmin: user?.role === "DM",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
