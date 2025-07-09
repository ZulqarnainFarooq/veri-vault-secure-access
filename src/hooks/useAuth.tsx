
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithBiometric: (biometricToken: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
  logAuthEvent: (eventType: string, success?: boolean, errorMessage?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid auth state recursion
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        // Create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
        }
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
          biometric_enabled: false,
          fingerprint_enabled: false,
          face_id_enabled: false,
          security_level: 'standard',
          initial_setup_complete: false
        });

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        // Fetch the newly created profile
        setTimeout(() => {
          fetchUserProfile(userId);
        }, 100);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const logAuthEvent = async (eventType: string, success: boolean = true, errorMessage?: string) => {
    if (!user) return;

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString()
      };

      await supabase.from('auth_logs').insert({
        user_id: user.id,
        event_type: eventType,
        device_info: deviceInfo,
        success,
        error_message: errorMessage
      });
    } catch (error) {
      console.error('Error logging auth event:', error);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });

      if (error) {
        await logAuthEvent('signup', false, error.message);
        return { error };
      }

      // If email confirmation is disabled, the user will be logged in immediately
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        });
      } else if (data.user && data.user.email_confirmed_at) {
        toast({
          title: "Account Created",
          description: "Welcome to VeriVault! Setting up your account...",
        });
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logAuthEvent('signup', false, errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await logAuthEvent('login', false, error.message);
        return { error };
      }

      await logAuthEvent('login', true);
      
      toast({
        title: "Welcome Back",
        description: "Successfully logged in to VeriVault.",
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logAuthEvent('login', false, errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signInWithBiometric = async (biometricToken: string) => {
    try {
      // In a real implementation, this would validate the biometric token
      // and create a proper Supabase session
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('biometric_token', biometricToken)
        .single();

      if (!profiles) {
        throw new Error('Invalid biometric credentials');
      }

      // For now, we'll use the stored session approach
      // In production, you'd implement proper token-based authentication
      await logAuthEvent('biometric_login', true);
      
      toast({
        title: "Biometric Login Successful",
        description: "Welcome back to VeriVault.",
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logAuthEvent('biometric_login', false, errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      await logAuthEvent('logout', true);
      await supabase.auth.signOut();
      
      toast({
        title: "Logged Out",
        description: "You have been securely logged out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        await logAuthEvent('password_reset', false, error.message);
        return { error };
      }

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logAuthEvent('password_reset', false, errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Refresh profile data
      await fetchUserProfile(user.id);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: { message: errorMessage } };
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithBiometric,
    signOut,
    resetPassword,
    updateProfile,
    logAuthEvent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
