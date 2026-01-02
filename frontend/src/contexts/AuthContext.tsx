import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import {
  User,
  AuthContextType,
  UserRole,
  AdminActionLog,
  FrontendActivityLog,
  Friendship,
} from "../types";
import { API_BASE_URL } from "../utils/apiConfig";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "bem_auth_token";
const CURRENT_USER_KEY = "bem_current_user";
const ADMIN_ACTION_LOGS_STORAGE_KEY = "bem_admin_action_logs";
const USER_ACTIVITY_LOGS_STORAGE_KEY = "bem_user_activity_logs";
const FRIENDSHIPS_STORAGE_KEY = "bem_friendships";

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  const [adminActionLogs, setAdminActionLogs] = useState<AdminActionLog[]>(
    () => getStoredData(ADMIN_ACTION_LOGS_STORAGE_KEY, [])
  );
  const [userActivityLogs, setUserActivityLogs] =
    useState<FrontendActivityLog[]>(() =>
      getStoredData(USER_ACTIVITY_LOGS_STORAGE_KEY, [])
    );
  const [friendships, setFriendships] = useState<Friendship[]>(() =>
    getStoredData(FRIENDSHIPS_STORAGE_KEY, [])
  );

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";
  const isOwner = currentUser?.role === "owner";

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

      setAdminActionLogs((prev) => [log, ...prev.slice(0, 49)]);
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

      setUserActivityLogs((prev) => [log, ...prev.slice(0, 99)]);
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
      } catch (err) {
        logout();
      }

      setLoadingAuthState(false);
    };

    loadSession();
  }, [logout]);

  /* --------------------------- BACKEND LOGIN --------------------------- */

  const login = async (
    identifier: string,
    password: string
  ): Promise<boolean> => {
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
      if (data.user.role === "admin" || data.user.role === "owner") {
        logAdminAction("Admin/Owner Logged In", data.user.id);
      }

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
    _countryCode: string,
    _phone: string,
    password: string,
    _profileImageUrl?: string
  ): Promise<boolean> => {
    setLoadingAuthState(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          countryCode: _countryCode,
          phone: _phone,
        }),
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

  /* --------------------------- PASSWORD (SIMULATED) --------------------------- */

  const changePassword = async () => ({
    success: false,
    message: "Password change endpoint not implemented yet.",
  });

  const forgotPassword = async () => ({
    success: false,
    message: "Forgot password endpoint not implemented yet.",
  });

  const resetPassword = async () => ({
    success: false,
    message: "Reset password endpoint not implemented yet.",
  });

  /* --------------------------- FRIENDSHIPS (FRONTEND ONLY) --------------------------- */

  const friendRequestCount = useMemo(() => {
    if (!currentUser) return 0;
    return friendships.filter(
      (f) => f.addresseeId === currentUser.id && f.status === "pending"
    ).length;
  }, [friendships, currentUser]);

  const getFriendshipStatus = () => ({ status: "not_friends" } as any);
  const sendFriendRequest = async () => ({ success: false });
  const acceptFriendRequest = async () => ({ success: false });
  const declineFriendRequest = async () => ({ success: false });
  const removeFriend = async () => ({ success: false });

  /* --------------------------- SOCIAL LOGIN (NOT REAL YET) --------------------------- */

  const socialLoginSim = async () => false;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        isOwner,
        loadingAuthState,
        login,
        register,
        logout,
        updateUserProfile: async () => false,
        adminActionLogs,
        logAdminAction,
        getAllUsers: () => [],
        updateUserRole: async () => ({ success: false }),
        userActivityLogs,
        logUserActivity,
        changePassword,
        forgotPassword,
        resetPassword,
        loginWithGoogle: () => socialLoginSim(),
        loginWithX: () => socialLoginSim(),
        loginWithFacebook: () => socialLoginSim(),
        loginWithApple: () => socialLoginSim(),
        loginWithMicrosoft: () => socialLoginSim(),
        loginWithGitHub: () => socialLoginSim(),
        loginWithLinkedIn: () => socialLoginSim(),
        friendships,
        friendRequestCount,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        getFriendshipStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
