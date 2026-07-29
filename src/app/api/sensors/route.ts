import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sensorType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query: any = adminDb.collection('sensor_data');

    if (sensorType) {
      query = query.where('sensorType', '==', sensorType);
    }
    
    query = query.orderBy('timestamp', 'desc').limit(limit);
    const snapshot = await query.get();

    const readings = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: readings,
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sensorId, sensorType, location, latitude, longitude, value, unit } = body;

    if (!sensorId || !sensorType || !value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newReading = {
      sensorId,
      sensorType,
      location: location || 'Unknown',
      latitude: latitude || 0,
      longitude: longitude || 0,
      value,
      unit: unit || 'unknown',
      timestamp: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('sensor_data').add(newReading);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...newReading },
    });
  } catch (error) {
    console.error('Error adding sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to add sensor data' },
      { status: 500 }
    );
  }
}
