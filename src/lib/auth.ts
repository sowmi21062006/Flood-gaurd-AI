import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthSession {
  uid: string;
  email: string;
  name: string;
  role: string;
  district?: string;
  language: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthSession | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch user details from Firestore to get role, district, etc.
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || userData?.email || '',
      name: userData?.name || decodedToken.name || '',
      role: userData?.role || 'citizen',
      district: userData?.district,
      language: userData?.language || 'english',
    };
  } catch (error) {
    console.error('Error verifying auth:', error);
    return null;
  }
}
