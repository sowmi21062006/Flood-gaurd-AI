import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, district, language } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
      throw authError;
    }

    const userData = {
      uid: userRecord.uid,
      name,
      email,
      role: role || 'citizen',
      district: district || null,
      language: language || 'english',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store additional user data in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userRecord.uid, // Using uid as id
          uid: userRecord.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
