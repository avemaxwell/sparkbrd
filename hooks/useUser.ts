"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: string;
  plan_limits: {
    max_boards: number;
    max_tacks_per_board: number;
  };
  board_count: number;
  created_at: string;
}

// Cache outside component - persists across renders but resets on hot reload
let cachedProfile: Profile | null = null;
let cachedLoading = true;
let isFetching = false;
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Define refreshProfile outside the hook so it's stable
const refreshProfile = async () => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileData) {
      cachedProfile = {
        ...profileData,
        email: session.user.email || '',
      };
      notifyListeners();
    }
  }
};

// Define signOut outside the hook so it's stable
const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  cachedProfile = null;
  cachedLoading = false;
  notifyListeners();
};

export function useUser() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const supabase = createClient();
    
    const listener = () => forceUpdate({});
    listeners.add(listener);

    // Only fetch if not already fetching and no cached profile
    if (!isFetching && cachedLoading) {
      isFetching = true;
      
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user && !cachedProfile) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileData) {
              cachedProfile = {
                ...profileData,
                email: session.user.email || '',
              };
            }
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        } finally {
          cachedLoading = false;
          isFetching = false;
          notifyListeners();
        }
      })();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        cachedProfile = null;
        cachedLoading = false;
        notifyListeners();
      } else if (event === 'SIGNED_IN' && session?.user && !cachedProfile && !isFetching) {
        isFetching = true;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          cachedProfile = {
            ...profileData,
            email: session.user.email || '',
          };
        }
        cachedLoading = false;
        isFetching = false;
        notifyListeners();
      }
    });

    return () => {
      listeners.delete(listener);
      subscription.unsubscribe();
    };
  }, []);

  return { 
    profile: cachedProfile, 
    loading: cachedLoading, 
    signOut, 
    refreshProfile 
  };
}