/**
 * Flood Inundation Mapping Agent
 * Generates street-level flood simulation and identifies affected areas
 */

import { adminDb } from '@/lib/firebase/admin';
import { generateAIResponse } from '@/services/groq';

interface FloodedRoad {
  roadId: string;
  roadName: string;
  coordinates: [number, number][];
  floodDepth: number;
  status: 'blocked' | 'warning' | 'safe';
}

interface FloodMapResult {
  floodedRoads: FloodedRoad[];
  affectedPopulation: number;
  affectedAreaKm: number;
  mapData: any;
  explanation?: string;
}

export class FloodInundationMappingAgent {
  private agentName = 'flood_mapping';

  /**
   * Log agent activity
   */
  private async logActivity(action: string, status: string, input: any, output: any, errorMessage?: string, executionTime?: number) {
    const data: any = {
      agent: this.agentName,
      action,
      status,
      input,
      output,
      timestamp: new Date().toISOString(),
    };
    if (errorMessage !== undefined) data.errorMessage = errorMessage;
    if (executionTime !== undefined) data.executionTime = executionTime;
    
    await adminDb.collection('agent_logs').add(data);
  }

  /**
   * Simulate flood inundation based on river level and terrain
   * This would use real DEM (Digital Elevation Model) data in production
   */
  private simulateFloodInundation(riverLevel: number, rainfall: number): {
    floodedAreas: any[];
    affectedAreaKm: number;
  } {
    // Simulate flooded areas based on elevation and proximity to river
    const floodRadius = Math.min(riverLevel * 0.5, 10); // km
    const floodedAreas = [];

    // Generate circular flood zones (simplified)
    const riverPoints = [
      { lat: 12.9716, lon: 77.5946 }, // Example: Bangalore
      { lat: 13.0827, lon: 80.2707 }, // Example: Chennai
    ];

    for (const point of riverPoints) {
      floodedAreas.push({
        type: 'circle',
        center: [point.lat, point.lon],
        radius: floodRadius * 1000, // meters
        depth: riverLevel > 4 ? 2.5 : riverLevel > 3 ? 1.5 : 0.5,
      });
    }

    const affectedAreaKm = Math.PI * Math.pow(floodRadius, 2) * riverPoints.length;

    return { floodedAreas, affectedAreaKm };
  }

  /**
   * Identify flooded roads
   */
  private identifyFloodedRoads(floodedAreas: any[], riverLevel: number): FloodedRoad[] {
    // Sample road network (in production, this would come from OSM or other GIS data)
    const roadNetwork = [
      {
        roadId: 'R001',
        roadName: 'Main Street',
        coordinates: [
          [12.9716, 77.5946],
          [12.9726, 77.5956],
          [12.9736, 77.5966],
        ] as [number, number][],
      },
      {
        roadId: 'R002',
        roadName: 'River Road',
        coordinates: [
          [12.9706, 77.5936],
          [12.9716, 77.5946],
          [12.9726, 77.5956],
        ] as [number, number][],
      },
      {
        roadId: 'R003',
        roadName: 'Highway 44',
        coordinates: [
          [13.0827, 80.2707],
          [13.0837, 80.2717],
          [13.0847, 80.2727],
        ] as [number, number][],
      },
      {
        roadId: 'R004',
        roadName: 'Bridge Avenue',
        coordinates: [
          [12.9696, 77.5926],
          [12.9706, 77.5936],
          [12.9716, 77.5946],
        ] as [number, number][],
      },
      {
        roadId: 'R005',
        roadName: 'Safe Hill Road',
        coordinates: [
          [12.9856, 77.6086],
          [12.9866, 77.6096],
          [12.9876, 77.6106],
        ] as [number, number][],
      },
    ];

    const floodedRoads: FloodedRoad[] = [];

    for (const road of roadNetwork) {
      // Check if road intersects with flooded areas
      let isFlooded = false;
      let maxDepth = 0;

      for (const coord of road.coordinates) {
        for (const floodZone of floodedAreas) {
          const distance = this.calculateDistance(coord[0], coord[1], floodZone.center[0], floodZone.center[1]);
          if (distance * 1000 < floodZone.radius) {
            isFlooded = true;
            maxDepth = Math.max(maxDepth, floodZone.depth);
          }
        }
      }

      let status: 'blocked' | 'warning' | 'safe';
      if (maxDepth > 1.5) status = 'blocked';
      else if (maxDepth > 0.5) status = 'warning';
      else status = 'safe';

      floodedRoads.push({
        roadId: road.roadId,
        roadName: road.roadName,
        coordinates: road.coordinates,
        floodDepth: maxDepth,
        status,
      });
    }

    return floodedRoads;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Estimate affected population
   */
  private estimateAffectedPopulation(affectedAreaKm: number): number {
    // Assume average population density of 1000 people/km²
    const populationDensity = 1000;
    return Math.floor(affectedAreaKm * populationDensity);
  }

  /**
   * Generate flood map
   */
  async generateFloodMap(predictionId: string, riverLevel: number, rainfall: number): Promise<FloodMapResult> {
    const startTime = Date.now();

    try {
      await this.logActivity('generate_flood_map', 'running', { predictionId, riverLevel, rainfall }, {});

      // Simulate flood inundation
      const { floodedAreas, affectedAreaKm } = this.simulateFloodInundation(riverLevel, rainfall);

      // Identify flooded roads
      const floodedRoads = this.identifyFloodedRoads(floodedAreas, riverLevel);

      // Estimate affected population
      const affectedPopulation = this.estimateAffectedPopulation(affectedAreaKm);

      // Create GeoJSON map data
      const mapData = {
        type: 'FeatureCollection',
        features: [
          ...floodedAreas.map((zone, idx) => ({
            type: 'Feature',
            id: `flood_zone_${idx}`,
            properties: {
              type: 'flood_zone',
              depth: zone.depth,
              severity: zone.depth > 2 ? 'critical' : zone.depth > 1 ? 'high' : 'moderate',
            },
            geometry: {
              type: 'Point',
              coordinates: [zone.center[1], zone.center[0]],
            },
          })),
          ...floodedRoads.map((road) => ({
            type: 'Feature',
            id: road.roadId,
            properties: {
              type: 'road',
              name: road.roadName,
              status: road.status,
              floodDepth: road.floodDepth,
            },
            geometry: {
              type: 'LineString',
              coordinates: road.coordinates.map((c) => [c[1], c[0]]),
            },
          })),
        ],
      };

      // 4. Generate AI Explanation
      const explanation = await generateAIResponse({
        systemPrompt: 'You are a geospatial AI explaining flood impacts. Keep it brief.',
        userPrompt: `Explain the geospatial impact: ${floodedRoads.length} roads flooded, ${affectedPopulation} people affected by river level ${riverLevel}m.`
      });

      // Save to database
      await adminDb.collection('flood_maps').add({
        predictionId,
        floodedRoads,
        floodDepth: floodedAreas, // Storing as JSON
        affectedPopulation,
        affectedAreaKm,
        mapData,
        explanation,
        createdAt: new Date().toISOString()
      });

      const result: FloodMapResult = {
        floodedRoads,
        affectedPopulation,
        affectedAreaKm,
        mapData,
        explanation,
      };

      const executionTime = Date.now() - startTime;
      await this.logActivity('generate_flood_map', 'completed', { predictionId }, result, undefined, executionTime);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logActivity('generate_flood_map', 'failed', { predictionId }, {}, errorMessage, executionTime);
      throw error;
    }
  }
}
