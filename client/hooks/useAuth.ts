import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  role: "admin" | "staff";
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp?: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sessionToken");
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      setSessionToken(data.sessionToken);
      localStorage.setItem("sessionToken", data.sessionToken);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (sessionToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToken}`,
          },
        });
      }
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem("sessionToken");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/auth/session", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setSessionToken(token);
          } else {
            setSessionToken(null);
            localStorage.removeItem("sessionToken");
            setIsLoading(false);
          }
        } else {
          setSessionToken(null);
          localStorage.removeItem("sessionToken");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
};
