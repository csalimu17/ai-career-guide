'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '../provider'

export interface UseSupabaseQueryResult<T> {
  data: T[] | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useSupabaseTable<T = any>(
  tableName: string,
  options?: {
    userId?: string | null
    filter?: { column: string; value: any }
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
  }
): UseSupabaseQueryResult<T> {
  const { supabase, user, isUserLoading } = useSupabase()
  const [data, setData] = useState<T[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const activeUserId = options?.userId ?? user?.id

  const fetchData = async () => {
    if (isUserLoading) return
    if (!activeUserId) {
      setData([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      let query = supabase.from(tableName).select('*')

      if (tableName !== 'profiles') {
        query = query.eq('user_id', activeUserId)
      } else {
        query = query.eq('id', activeUserId)
      }

      if (options?.filter) {
        query = query.eq(options.filter.column, options.filter.value)
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data: result, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      setData(result as T[])
      setError(null)
    } catch (err: any) {
      console.warn(`[useSupabaseTable:${tableName}] Query notice:`, err?.message)
      setData([])
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tableName, activeUserId, isUserLoading])

  return { data, isLoading, error, refetch: fetchData }
}
