import { signupEmailRedirect } from '../lib/auth-destination';
import { displayName } from '../lib/author-profile';
import { useIntegrationStore } from '../store/useIntegrationStore';
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, handleSupabaseError, supabaseConfigError } from '../lib/supabase'

interface UserProfile {
  tier: 'free' | 'lite' | 'express' | 'craft'
  subscription_status: string
  trial_ends_at: string | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (e: string, p: string) => Promise<void>
  signUp: (e: string, p: string, next?: 'billing') => Promise<{requiresConfirmation: boolean}>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(!supabaseConfigError)

  const [profileRevision, setProfileRevision] = useState(0)
  const [authError, setAuthError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (supabaseConfigError) return
    let active = true
    let authEventReceived = false
    const timeout = window.setTimeout(() => {
      if (active) {
        setAuthError('Restoring your session took too long. Please reload to try again.')
        setLoading(false)
      }
    }, 15000)
    // Keep this callback synchronous: database calls here can lock the auth client.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      authEventReceived = true
      window.clearTimeout(timeout)
      useIntegrationStore.getState().configureOwner(nextSession?.user?.id || null)
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setAuthError(null)
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authEventReceived) return
      if (error) throw error
      useIntegrationStore.getState().configureOwner(data.session?.user?.id || null)
      setSession(data.session)
      setUser(data.session?.user ?? null)
    }).catch(() => {
      if (active && !authEventReceived) setAuthError('Could not restore your session. Please sign in again.')
    }).finally(() => {
      if (active) {
        window.clearTimeout(timeout)
        setLoading(false)
      }
    })
    return () => { active = false; window.clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  // Profile retrieval happens after auth has released its lock, and cannot block rendering.
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      controller.abort()
      if (active && user?.id) setProfileError('Account details took too long to load. Please retry.')
    }, 10000)
    setProfile(null)
    setProfileError(null)
    if (user?.id) {
      void (async () => {
        try {
          const { data, error } = await supabase.from('user_profiles')
            .select('tier, subscription_status, trial_ends_at').eq('id', user.id)
            .abortSignal(controller.signal).single()
          if (error) throw error
          if (active) setProfile(data)
          if (typeof supabase.rpc === 'function') {
            try {
              const entitlement = await supabase.rpc('paypal_has_lite').abortSignal(controller.signal)
              if (active && !entitlement.error && entitlement.data === true) setProfile({...data, tier: 'lite'})
            } catch { /* A billing lookup must not block free writing access. */ }
          }
        } catch (error) {
          if (active) {
            handleSupabaseError(error)
            setProfileError('Account details are unavailable. Please retry or contact the site administrator.')
          }
        } finally { window.clearTimeout(timeout) }
      })()
    }
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [user?.id, profileRevision])

  const refreshProfile = async () => { setProfileRevision(value => value + 1) }

  const signIn = async (email: string, pass: string) => {
    if (supabaseConfigError) throw new Error(supabaseConfigError)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) throw error
  }

  const signUp = async (email: string, pass: string, next?: 'billing') => {
    if (supabaseConfigError) throw new Error(supabaseConfigError)
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: signupEmailRedirect(window.location.origin, next) } })
    if (error) throw error
    return {requiresConfirmation: !data.session}
  }

  const updateDisplayName = async (name: string) => {
    if (!user?.id || useIntegrationStore.getState().owner !== user.id) throw new Error('Please sign in before editing your profile.');
    if (name.trim().length > 80) throw new Error('Use a display name of up to 80 characters.');
    const owner = user.id;
    // Presentation metadata only; never used for permissions, tier or ownership.
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: displayName(name) } });
    if (error) throw new Error('Could not save your display name. Please try again.');
    if (useIntegrationStore.getState().owner !== owner || data.user?.id !== owner) throw new Error('Your account changed. Please try again.');
    setUser(data.user);
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile, updateDisplayName }}>
      {loading ? <div role="status" className="min-h-screen flex items-center justify-center text-slate-200">Restoring your session…</div> : <>
        {authError && <div role="alert" className="p-4 bg-amber-950 text-amber-100">{authError}</div>}
        {profileError && <div role="alert" className="p-4 bg-amber-950 text-amber-100">{profileError} <button onClick={refreshProfile} className="underline">Retry account details</button></div>}
        {children}
      </>}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
