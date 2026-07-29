/**
 * Database seed script
 * Run this to populate initial data for testing and demonstration
 */

import { adminDb } from '@/lib/firebase/admin';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Seed shelters
    console.log('Adding shelters...');
    const shelters = [
      {
        shelterId: 'shelter_001',
        name: 'Bangalore Central Community Hall',
        address: 'MG Road, Bangalore',
        district: 'Bangalore Urban',
        latitude: 12.9716,
        longitude: 77.5946,
        capacity: 500,
        currentOccupancy: 0,
        available: true,
        facilities: ['medical', 'food', 'water', 'toilets', 'electricity'],
        contactPerson: 'Mr. Sharma',
        contactPhone: '+91-9876543210',
      },
      {
        shelterId: 'shelter_002',
        name: 'Jayanagar Sports Complex',
        address: 'Jayanagar 4th Block, Bangalore',
        district: 'Bangalore Urban',
        latitude: 12.9254,
        longitude: 77.5971,
        capacity: 300,
        currentOccupancy: 0,
        available: true,
        facilities: ['medical', 'food', 'water', 'toilets'],
        contactPerson: 'Ms. Reddy',
        contactPhone: '+91-9876543211',
      },
      {
        shelterId: 'shelter_003',
        name: 'Whitefield Community Center',
        address: 'Whitefield, Bangalore',
        district: 'Bangalore Urban',
        latitude: 12.9698,
        longitude: 77.7500,
        capacity: 400,
        currentOccupancy: 0,
        available: true,
        facilities: ['medical', 'food', 'water', 'toilets', 'electricity', 'blankets'],
        contactPerson: 'Mr. Kumar',
        contactPhone: '+91-9876543212',
      },
      {
        shelterId: 'shelter_004',
        name: 'Chennai Marina Beach Hall',
        address: 'Marina Beach Road, Chennai',
        district: 'Chennai',
        latitude: 13.0827,
        longitude: 80.2707,
        capacity: 600,
        currentOccupancy: 0,
        available: true,
        facilities: ['medical', 'food', 'water', 'toilets', 'electricity'],
        contactPerson: 'Dr. Iyer',
        contactPhone: '+91-9876543213',
      },
      {
        shelterId: 'shelter_005',
        name: 'T. Nagar Relief Center',
        address: 'T. Nagar, Chennai',
        district: 'Chennai',
        latitude: 13.0418,
        longitude: 80.2341,
        capacity: 350,
        currentOccupancy: 0,
        available: true,
        facilities: ['medical', 'food', 'water', 'toilets'],
        contactPerson: 'Mrs. Lakshmi',
        contactPhone: '+91-9876543214',
      },
    ];

    const batch = adminDb.batch();

    for (const shelter of shelters) {
      const ref = adminDb.collection('shelters').doc(shelter.shelterId);
      batch.set(ref, shelter);
    }
    await batch.commit();
    console.log('✅ Shelters added');

    // Seed initial sensor data
    console.log('Adding sensor data...');
    const now = new Date().toISOString();
    const sensorData = [
      {
        sensorId: 'RIVER_001',
        sensorType: 'river_level',
        location: 'Bangalore North River Station',
        latitude: 12.9716,
        longitude: 77.5946,
        value: 3.2,
        unit: 'meters',
        timestamp: now,
      },
      {
        sensorId: 'RAIN_001',
        sensorType: 'rainfall',
        location: 'Bangalore Central',
        latitude: 12.9716,
        longitude: 77.5946,
        value: 15.5,
        unit: 'mm',
        timestamp: now,
      },
      {
        sensorId: 'HUMID_001',
        sensorType: 'humidity',
        location: 'Bangalore Central',
        latitude: 12.9716,
        longitude: 77.5946,
        value: 75.0,
        unit: 'percentage',
        timestamp: now,
      },
      {
        sensorId: 'TEMP_001',
        sensorType: 'temperature',
        location: 'Bangalore Central',
        latitude: 12.9716,
        longitude: 77.5946,
        value: 28.5,
        unit: 'celsius',
        timestamp: now,
      },
      {
        sensorId: 'WIND_001',
        sensorType: 'wind_speed',
        location: 'Bangalore Central',
        latitude: 12.9716,
        longitude: 77.5946,
        value: 12.0,
        unit: 'kmph',
        timestamp: now,
      },
    ];

    const sensorBatch = adminDb.batch();
    for (const data of sensorData) {
      const ref = adminDb.collection('sensor_data').doc();
      sensorBatch.set(ref, data);
    }
    await sensorBatch.commit();
    console.log('✅ Sensor data added');

    // Seed historical flood data (for ML training)
    console.log('Adding historical flood data...');
    const historicalFloods = [
      {
        eventDate: new Date('2023-08-15').toISOString(),
        location: 'Bangalore North',
        district: 'Bangalore Urban',
        rainfall: 85.5,
        riverLevel: 5.8,
        humidity: 92,
        temperature: 26.5,
        windSpeed: 25,
        floodOccurred: true,
        severity: 'high',
        casualties: 2,
        damageEstimate: 50000000,
      },
      {
        eventDate: new Date('2023-07-20').toISOString(),
        location: 'Bangalore South',
        district: 'Bangalore Urban',
        rainfall: 45.2,
        riverLevel: 3.2,
        humidity: 78,
        temperature: 27.8,
        windSpeed: 15,
        floodOccurred: false,
        severity: 'low',
        casualties: 0,
        damageEstimate: 0,
      },
      {
        eventDate: new Date('2023-09-10').toISOString(),
        location: 'Chennai East',
        district: 'Chennai',
        rainfall: 120.0,
        riverLevel: 6.5,
        humidity: 95,
        temperature: 25.0,
        windSpeed: 35,
        floodOccurred: true,
        severity: 'critical',
        casualties: 8,
        damageEstimate: 150000000,
      },
    ];

    const historyBatch = adminDb.batch();
    for (const data of historicalFloods) {
      const ref = adminDb.collection('historical_floods').doc();
      historyBatch.set(ref, data);
    }
    await historyBatch.commit();
    console.log('✅ Historical flood data added');

    console.log('🎉 Database seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
