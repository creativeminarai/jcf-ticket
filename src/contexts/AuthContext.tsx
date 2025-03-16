"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // セッションの確認と監視
    const checkSession = async () => {
      try {
        // 現在のセッションを取得
        const { data: { session }, error } = await supabaseBrowser.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
        }

        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error("Unexpected error during session check:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 初期セッションチェック
    checkSession();

    // セッション変更を監視
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      // クリーンアップ
      subscription.unsubscribe();
    };
  }, []);

  // ログイン処理
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 会員登録処理
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.signOut();
      if (error) {
        throw error;
      }
      
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // パスワードリセット
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 