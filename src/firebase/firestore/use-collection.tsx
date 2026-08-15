'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { isDeepEqual } from '@/lib/utils';
import { supabaseDb } from '@/lib/supabase/db';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

async function fetchFromSupabaseFallback(path: string): Promise<any[] | null> {
  try {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[0] === 'users') {
      const userId = parts[1];
      const collectionName = parts[2];

      if (collectionName === 'jobApplications') {
        return await supabaseDb.getJobApplications(userId);
      } else if (collectionName === 'resumes') {
        return await supabaseDb.getResumes(userId);
      } else if (collectionName === 'coverLetters') {
        return await supabaseDb.getCoverLetters(userId);
      }
    }
  } catch (err) {
    console.warn('[useCollection:SupabaseFallback] Query warning:', err);
  }
  return null;
}

export function useCollection<T = any>(
  memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean}) | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(memoizedTargetRefOrQuery));
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const [prevQuery, setPrevQuery] = useState(memoizedTargetRefOrQuery);
  if (memoizedTargetRefOrQuery !== prevQuery) {
    setPrevQuery(memoizedTargetRefOrQuery);
    setIsLoading(Boolean(memoizedTargetRefOrQuery));
    setData(null);
    setError(null);
  }

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const path: string =
      memoizedTargetRefOrQuery.type === 'collection'
        ? (memoizedTargetRefOrQuery as CollectionReference).path
        : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        
        setData(prev => {
          if (isDeepEqual(prev, results)) return prev;
          return results;
        });
        setError(null);
        setIsLoading(false);
      },
      async (error: FirestoreError) => {
        // Fallback to Supabase
        const supabaseData = await fetchFromSupabaseFallback(path);
        if (supabaseData) {
          setData(supabaseData as ResultItemType[]);
          setError(null);
        } else {
          setData([]);
          setError(null);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}