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

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("id, email, name, role")
          .eq("id", data.user.id)
          .single();

        if (staffError) throw staffError;

        setUser({
          id: data.user.id,
          email: staffData.email,
          name: staffData.name,
          role: staffData.role,
        });
      }
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
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user) {
          const { data: staffData, error } = await supabase
            .from("staff")
            .select("id, email, name, role")
            .eq("id", data.session.user.id)
            .single();

          if (!error && staffData) {
            setUser({
              id: data.session.user.id,
              email: staffData.email,
              name: staffData.name,
              role: staffData.role,
            });
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: staffData } = await supabase
            .from("staff")
            .select("id, email, name, role")
            .eq("id", session.user.id)
            .single();

          if (staffData) {
            setUser({
              id: session.user.id,
              email: staffData.email,
              name: staffData.name,
              role: staffData.role,
            });
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
};
