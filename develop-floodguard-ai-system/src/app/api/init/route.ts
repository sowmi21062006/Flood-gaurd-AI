import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  try {
    console.log('Initialize FloodGuard AI (Firebase)...');

    // Check if admin already exists
    const usersSnapshot = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
    
    if (!usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'Application already initialized. Users exist in database.',
      });
    }

    // Create default admin user
    let adminRecord;
    try {
      adminRecord = await adminAuth.createUser({
        email: 'admin@floodguard.ai',
        password: 'admin123',
        displayName: 'System Administrator',
      });
    } catch (e: any) {
      if (e.code === 'auth/email-already-exists') {
        adminRecord = await adminAuth.getUserByEmail('admin@floodguard.ai');
      } else throw e;
    }

    await adminDb.collection('users').doc(adminRecord.uid).set({
      uid: adminRecord.uid,
      name: 'System Administrator',
      email: 'admin@floodguard.ai',
      role: 'admin',
      district: 'Bangalore Urban',
      language: 'english',
    });
    console.log('Admin user created');

    // Create test emergency officer
    let officerRecord;
    try {
      officerRecord = await adminAuth.createUser({
        email: 'officer@floodguard.ai',
        password: 'officer123',
        displayName: 'Emergency Officer',
      });
    } catch (e: any) {
      if (e.code === 'auth/email-already-exists') {
        officerRecord = await adminAuth.getUserByEmail('officer@floodguard.ai');
      } else throw e;
    }

    await adminDb.collection('users').doc(officerRecord.uid).set({
      uid: officerRecord.uid,
      name: 'Emergency Officer',
      email: 'officer@floodguard.ai',
      role: 'emergency_officer',
      district: 'Chennai',
      language: 'english',
    });
    console.log('Emergency officer created');

    // Seed database with sample data
    await seedDatabase();

    return NextResponse.json({
      success: true,
      message: 'FloodGuard AI initialized successfully!',
      credentials: {
        admin: {
          email: 'admin@floodguard.ai',
          password: 'admin123',
          role: 'admin',
        },
        officer: {
          email: 'officer@floodguard.ai',
          password: 'officer123',
          role: 'emergency_officer',
        },
      },
      note: 'Please change these passwords in production!',
    });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
