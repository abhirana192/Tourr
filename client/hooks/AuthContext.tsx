import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (token) {
      setSessionToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Check session when token is set
  useEffect(() => {
    if (!sessionToken) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          headers: {
            "Authorization": `Bearer ${sessionToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          } else {
            setSessionToken(null);
            localStorage.removeItem("sessionToken");
          }
        } else {
          setSessionToken(null);
          localStorage.removeItem("sessionToken");
        }
      } catch (error) {
        console.error("Session check error:", error);
        setSessionToken(null);
        localStorage.removeItem("sessionToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [sessionToken]);

  const login = useCallback(async (name: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
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

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
