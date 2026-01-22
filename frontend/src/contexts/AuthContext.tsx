import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  User,
  AuthContextType,
  UserRole,
  AdminActionLog,
  FrontendActivityLog,
} from "../types";
import { API_BASE_URL } from "../utils/apiConfig";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "bem_auth_token";
const CURRENT_USER_KEY = "bem_current_user";
const ADMIN_ACTION_LOGS_STORAGE_KEY = "bem_admin_action_logs";
const USER_ACTIVITY_LOGS_STORAGE_KEY = "bem_user_activity_logs";

const getStoredData = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveStoredData = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error saving data:", e);
  }
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStoredData<User | null>(CURRENT_USER_KEY, null)
  );
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  const [adminActionLogs, setAdminActionLogs] = useState<AdminActionLog[]>(
    () => getStoredData(ADMIN_ACTION_LOGS_STORAGE_KEY, [])
  );
  const [userActivityLogs, setUserActivityLogs] = useState<FrontendActivityLog[]>(
    () => getStoredData(USER_ACTIVITY_LOGS_STORAGE_KEY, [])
  );

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === "admin";

  /* --------------------------- LOGGING HELPERS --------------------------- */

  const logAdminAction = useCallback(
    (action: string, targetId?: string, details?: string) => {
      if (!currentUser || !isAdmin) return;

      const log: AdminActionLog = {
        id: `admin-${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminId: currentUser.id,
        adminName: currentUser.fullName,
        action,
        targetId,
        details,
      };

      setAdminActionLogs((prev) => {
        const next = [log, ...prev.slice(0, 49)];
        saveStoredData(ADMIN_ACTION_LOGS_STORAGE_KEY, next);
        return next;
      });
    },
    [currentUser, isAdmin]
  );

  const logUserActivity = useCallback(
    (
      description: string,
      type: FrontendActivityLog["type"],
      itemId?: string,
      itemType?: FrontendActivityLog["itemType"]
    ) => {
      if (!currentUser) return;

      const log: FrontendActivityLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        description,
        type,
        itemId,
        itemType,
      };

      setUserActivityLogs((prev) => {
        const next = [log, ...prev.slice(0, 99)];
        saveStoredData(USER_ACTIVITY_LOGS_STORAGE_KEY, next);
        return next;
      });
    },
    [currentUser]
  );

  /* --------------------------- LOGOUT --------------------------- */

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  }, []);

  /* --------------------------- LOAD TOKEN ON START --------------------------- */

  useEffect(() => {
    const loadSession = async () => {
      setLoadingAuthState(true);

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setLoadingAuthState(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error("Token invalid");

        const user = data.user ?? data;
        setCurrentUser(user);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } catch {
        logout();
      }

      setLoadingAuthState(false);
    };

    loadSession();
  }, [logout]);

  /* --------------------------- BACKEND LOGIN --------------------------- */

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setLoadingAuthState(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoadingAuthState(false);
        return false;
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      setCurrentUser(data.user);

      logUserActivity("User logged in", "user_login");
      if (data.user.role === "admin") logAdminAction("Admin Logged In", data.user.id);

      setLoadingAuthState(false);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setLoadingAuthState(false);
      return false;
    }
  };

  /* --------------------------- BACKEND REGISTER --------------------------- */

  const register = async (
    fullName: string,
    email: string,
    countryCode: string,
    phone: string,
    password: string,
    _profileImageUrl?: string
  ): Promise<boolean> => {
    setLoadingAuthState(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, countryCode, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoadingAuthState(false);
        return false;
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      setCurrentUser(data.user);

      logUserActivity("User registered", "user_registration");

      setLoadingAuthState(false);
      return true;
    } catch (err) {
      console.error("Register error:", err);
      setLoadingAuthState(false);
      return false;
    }
  };

  /* --------------------------- USERS (ADMIN) --------------------------- */

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) return [];
      const users = await res.json();
      return Array.isArray(users) ? users : [];
    } catch (e) {
      console.error("getAllUsers error:", e);
      return [];
    }
  }, []);

  const updateUserRole = useCallback(
    async (userId: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ role }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, message: data?.error || "Failed to update role." };
        }

        // If admin edits their own role or current user is updated, keep session consistent
        if (data?.user?.id && currentUser?.id === data.user.id) {
          setCurrentUser(data.user);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        }

        logAdminAction("Updated user role", userId, `role=${role}`);
        return { success: true };
      } catch (e) {
        console.error("updateUserRole error:", e);
        return { success: false, message: "Failed to update role." };
      }
    },
    [currentUser, logAdminAction]
  );

  /* --------------------------- PASSWORD --------------------------- */

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data?.error || "Failed to change password." };
      }

      return { success: true, message: data?.message || "Password updated." };
    } catch (error) {
      console.error("changePassword error:", error);
      return { success: false, message: "Failed to change password." };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data?.error || "Failed to send reset email." };
      }

      return { success: true, message: data?.message || "Reset email sent.", token: data?.token };
    } catch (error) {
      console.error("forgotPassword error:", error);
      return { success: false, message: "Failed to send reset email." };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data?.error || "Failed to reset password." };
      }

      return { success: true, message: data?.message || "Password reset successfully." };
    } catch (error) {
      console.error("resetPassword error:", error);
      return { success: false, message: "Failed to reset password." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        loadingAuthState,
        login,
        register,
        logout,

        updateUserProfile: async () => false,

        adminActionLogs,
        logAdminAction,

        getAllUsers,
        updateUserRole,

        userActivityLogs,
        logUserActivity,

        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
