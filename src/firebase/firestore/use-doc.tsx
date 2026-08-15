'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { isDeepEqual } from '@/lib/utils';
import { supabaseDb } from '@/lib/supabase/db';

type WithId<T> = T & { id: string };

export interface UseDocOptions {
  suppressGlobalError?: boolean;
}

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

async function fetchFromSupabaseDocFallback(path: string): Promise<any | null> {
  try {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'users') {
      const userId = parts[1];
      return await supabaseDb.getProfile(userId);
    } else if (parts.length === 4 && parts[0] === 'users' && parts[2] === 'resumes') {
      const resumeId = parts[3];
      return await supabaseDb.getResume(resumeId);
    }
  } catch (err) {
    console.warn('[useDoc:SupabaseFallback] Query warning:', err);
  }
  return null;
}

export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
  options: UseDocOptions = {}
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(memoizedDocRef));
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const [prevRef, setPrevRef] = useState(memoizedDocRef);
  if (memoizedDocRef !== prevRef) {
    setPrevRef(memoizedDocRef);
    setIsLoading(Boolean(memoizedDocRef));
    setData(null);
    setError(null);
  }

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const path = memoizedDocRef.path;

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const result = { ...(snapshot.data() as T), id: snapshot.id };
          setData(prev => {
            if (isDeepEqual(prev, result)) return prev;
            return result;
          });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      async (error: FirestoreError) => {
        const supabaseDoc = await fetchFromSupabaseDocFallback(path);
        if (supabaseDoc) {
          setData(supabaseDoc as WithId<T>);
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
