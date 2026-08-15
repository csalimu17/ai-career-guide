'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from './client'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'master' | 'agency'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  usage?: {
    atsChecks?: number
    resumesCreated?: number
    coverLettersCreated?: number
  }
}

interface SupabaseContextType {
  supabase: ReturnType<typeof createClient>
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isUserLoading: boolean
  signOut: () => Promise<void>
}

export const SupabaseContext = createContext<SupabaseContextType | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)

  const fetchProfile = React.useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as UserProfile)
      }
    } catch (err) {
      console.error('[SupabaseProvider] Error loading user profile:', err)
    } finally {
      setIsUserLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsUserLoading(false)
      }
    })

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setIsUserLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        user,
        session,
        profile,
        isUserLoading,
        signOut,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export function useAuthUser() {
  const { user, profile, isUserLoading, signOut } = useSupabase()
  return {
    user,
    uid: user?.id,
    profile,
    plan: profile?.plan || 'free',
    isUserLoading,
    signOut,
  }
}
