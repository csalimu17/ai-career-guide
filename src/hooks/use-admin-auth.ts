import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"
import { SYSTEM_ROLES, PermissionKey } from "@/lib/admin/rbac"

export function useAdminAuth(requiredPermission?: PermissionKey) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'adminUsers', user.uid)
  }, [db, user])

  const { data: adminRecord, isLoading: isAdminLoading } = useDoc(adminDocRef)

  const isLoading = isUserLoading || isAdminLoading
  // SECURITY: Only honour the dev bypass when NODE_ENV is *explicitly* set to
  // 'development'. The previous `|| !process.env.NODE_ENV` clause granted admin
  // to any authenticated user in any deploy where the env var was unset.
  const isDev = process.env.NODE_ENV === 'development'
  const isAuthorized = adminRecord?.isActive === true || (isDev && !!user)

  // Permission Check logic
  const hasPermission = useCallback((permission: PermissionKey) => {
    if (!adminRecord) return false
    
    // Super admin bypass
    if (adminRecord.roleIds?.includes('super-admin')) return true
    
    // Check assigned roles for the permission
    const userPermissions = new Set<string>()
    adminRecord.roleIds?.forEach((roleId: string) => {
      const roleDef = Object.values(SYSTEM_ROLES).find(r => r.id === roleId)
      roleDef?.permissions.forEach(p => userPermissions.add(p))
    })

    // Check specific permission overrides
    adminRecord.permissionOverrides?.forEach((p: string) => userPermissions.add(p))
    
    return userPermissions.has(permission)
  }, [adminRecord])

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace('/dashboard') // Redirect non-admins away without building a back-stack loop
    }
    
    if (!isLoading && requiredPermission && !hasPermission(requiredPermission)) {
      router.replace('/admin/unauthorized')
    }
  }, [hasPermission, isLoading, isAuthorized, router, requiredPermission])

  return {
    adminRecord,
    isLoading,
    isAuthorized,
    hasPermission
  }
}
