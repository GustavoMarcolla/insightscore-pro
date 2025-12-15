import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSeniorX, SeniorUser } from "./useSeniorX";

// Interface para unificar usuário Supabase e Senior X
export interface UnifiedUser {
  id: string;
  email: string;
  fullName: string;
  authProvider: 'supabase' | 'seniorx';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Integração com Senior X
  const {
    seniorUser,
    isSeniorXMode,
    isLoading: seniorLoading,
    isAuthenticated: seniorAuthenticated,
    clearSeniorAuth,
  } = useSeniorX();

  useEffect(() => {
    // Se já autenticou via Senior X, não precisa do Supabase auth
    if (isSeniorXMode && seniorAuthenticated) {
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isSeniorXMode, seniorAuthenticated]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Limpa autenticação Senior X se existir
    if (seniorAuthenticated) {
      clearSeniorAuth();
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return { error };
  };

  // Cria usuário unificado
  const getUnifiedUser = (): UnifiedUser | null => {
    if (seniorAuthenticated && seniorUser) {
      return {
        id: seniorUser.id,
        email: seniorUser.email,
        fullName: seniorUser.fullName,
        authProvider: 'seniorx',
      };
    }
    
    if (user) {
      return {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || '',
        authProvider: 'supabase',
      };
    }
    
    return null;
  };

  // Verifica se está autenticado (por qualquer método)
  const isAuthenticated = !!(user || (seniorAuthenticated && seniorUser));
  
  // Loading considera ambos os sistemas
  const isLoading = isSeniorXMode ? seniorLoading : loading;

  return {
    user,
    session,
    loading: isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    // Campos para integração Senior X
    seniorUser,
    seniorAuthenticated,
    isSeniorXMode,
    isAuthenticated,
    unifiedUser: getUnifiedUser(),
  };
}
