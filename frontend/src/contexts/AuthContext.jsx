import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Initialize: check existing session & listen for auth changes ──
  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
        });
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ──
  const login = async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) throw error;
    return data;
  };

  // ── Register ──
  const register = async ({ name, email, password }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      console.log('Supabase signUp response:', { data, error });

      if (error) {
        console.error('Supabase signUp error:', error);
        throw new Error(error.message || error.error_description || JSON.stringify(error));
      }

      // Supabase returns an empty identities array when the email already exists
      // (with email confirmation enabled) instead of throwing an error
      if (data?.user?.identities?.length === 0) {
        throw new Error('An account with this email already exists.');
      }

      // If email confirmation is required, there won't be a session yet
      if (data?.user && !data?.session) {
        throw new Error('Registration successful! Please check your email to confirm your account before signing in.');
      }

      return data;
    } catch (err) {
      console.error('Register catch block:', err);
      throw err;
    }
  };

  // ── Logout ──
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
