import { NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { auth as adminAuth, db } from '@/firebase/admin';

type AdminRecord = {
  isActive?: boolean;
  roleIds?: string[];
  permissionOverrides?: string[];
  email?: string;
};

type AuthSuccess = {
  ok: true;
  decodedToken: DecodedIdToken;
};

type AdminSuccess = AuthSuccess & {
  adminRecord: AdminRecord;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireAuthenticatedUser(request: Request): Promise<AuthSuccess | AuthFailure> {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const idToken = authorization.slice('Bearer '.length).trim();
  if (!idToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return {
      ok: true,
      decodedToken,
    };
  } catch (error) {
    console.error('[RouteAuth] Failed to verify Firebase ID token:', error);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
}

export async function requireActiveAdmin(request: Request): Promise<AdminSuccess | AuthFailure> {
  const authResult = await requireAuthenticatedUser(request);
  if (!authResult.ok) {
    return authResult;
  }

  try {
    const adminRef = db.collection('adminUsers').doc(authResult.decodedToken.uid);
    const adminSnapshot = await adminRef.get();
    const adminRecord = (adminSnapshot.data() as AdminRecord | undefined) ?? {};

    if (!adminSnapshot.exists || adminRecord.isActive !== true) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    return {
      ok: true,
      decodedToken: authResult.decodedToken,
      adminRecord,
    };
  } catch (error) {
    console.error('[RouteAuth] Failed to verify admin access:', error);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
}
