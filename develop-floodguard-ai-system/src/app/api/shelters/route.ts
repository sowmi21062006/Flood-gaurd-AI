import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('shelters').get();
    const allShelters = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json({ success: true, data: allShelters });
  } catch (error) {
    console.error('Error fetching shelters:', error);
    return NextResponse.json({ error: 'Failed to fetch shelters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, district, latitude, longitude, capacity, facilities, contactPerson, contactPhone } = body;

    const shelterId = `shelter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newShelter = {
      shelterId,
      name,
      address,
      district,
      latitude,
      longitude,
      capacity,
      currentOccupancy: 0,
      available: true,
      facilities: facilities || [],
      contactPerson: contactPerson || null,
      contactPhone: contactPhone || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('shelters').add(newShelter);

    return NextResponse.json({ success: true, data: { id: docRef.id, ...newShelter } });
  } catch (error) {
    console.error('Error creating shelter:', error);
    return NextResponse.json({ error: 'Failed to create shelter' }, { status: 500 });
  }
}
