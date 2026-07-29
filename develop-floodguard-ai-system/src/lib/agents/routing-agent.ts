/**
 * Evacuation Routing Agent
 * Finds safest evacuation routes avoiding flooded areas
 */
import { adminDb } from '@/lib/firebase/admin';
import { generateAIResponse } from '@/services/groq';

interface RoutePoint {
  lat: number;
  lon: number;
}

interface Shelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  available: boolean;
  distance: number;
}

interface SafeRoute {
  routeId: string;
  path: RoutePoint[];
  distance: number;
  safetyScore: number;
  estimatedTime: number;
  shelter: Shelter;
  avoidedHazards: string[];
  explanation?: string;
}

export class EvacuationRoutingAgent {
  private agentName = 'evacuation_routing';

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
   * Find nearest available shelters
   */
  async findNearestShelters(userLat: number, userLon: number, limit = 5): Promise<Shelter[]> {
    const sheltersSnap = await adminDb.collection('shelters')
      .where('available', '==', true)
      .get();
      
    const allShelters = sheltersSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        capacity: data.capacity,
        currentOccupancy: data.currentOccupancy,
        available: data.available,
      };
    });

    const sheltersWithDistance = allShelters.map((shelter: any) => ({
      ...shelter,
      distance: this.calculateDistance(userLat, userLon, shelter.latitude, shelter.longitude),
    }));

    return sheltersWithDistance
      .filter((s: any) => s.currentOccupancy < s.capacity)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, limit);
  }

  /**
   * Calculate route safety score based on flooded roads
   */
  private calculateSafetyScore(path: RoutePoint[], floodedRoads: any[]): {
    safetyScore: number;
    avoidedHazards: string[];
  } {
    let safetyScore = 100;
    const avoidedHazards: string[] = [];

    // Check if route intersects with flooded areas
    for (const road of floodedRoads) {
      if (road.status === 'blocked') {
        // Check if path is near this flooded road
        for (const point of path) {
          for (const roadCoord of road.coordinates) {
            const distance = this.calculateDistance(point.lat, point.lon, roadCoord[0], roadCoord[1]);
            if (distance < 0.5) {
              // Within 500m of flooded road
              safetyScore -= 20;
              avoidedHazards.push(road.roadName);
              break;
            }
          }
        }
      } else if (road.status === 'warning') {
        for (const point of path) {
          for (const roadCoord of road.coordinates) {
            const distance = this.calculateDistance(point.lat, point.lon, roadCoord[0], roadCoord[1]);
            if (distance < 0.2) {
              safetyScore -= 5;
            }
          }
        }
      }
    }

    return {
      safetyScore: Math.max(safetyScore, 0),
      avoidedHazards: [...new Set(avoidedHazards)],
    };
  }

  /**
   * Generate safe route using A* algorithm over a grid
   */
  private generateSafeRoute(
    start: RoutePoint,
    end: RoutePoint,
    floodedRoads: any[]
  ): {
    path: RoutePoint[];
    distance: number;
  } {
    // 1. Define grid bounds based on start and end
    const minLat = Math.min(start.lat, end.lat) - 0.05;
    const maxLat = Math.max(start.lat, end.lat) + 0.05;
    const minLon = Math.min(start.lon, end.lon) - 0.05;
    const maxLon = Math.max(start.lon, end.lon) + 0.05;

    // 2. Grid resolution (e.g. 0.005 degrees ~ 500m)
    const gridSize = 0.005;

    // Helper to get grid cell indices
    const toGrid = (lat: number, lon: number) => ({
      x: Math.round((lon - minLon) / gridSize),
      y: Math.round((lat - minLat) / gridSize)
    });

    const fromGrid = (x: number, y: number) => ({
      lat: minLat + y * gridSize,
      lon: minLon + x * gridSize
    });

    const startGrid = toGrid(start.lat, start.lon);
    const endGrid = toGrid(end.lat, end.lon);

    // 3. Mark obstacles (cells close to flooded roads)
    const obstacles = new Set<string>();
    
    // We expand flooded roads into grid cells
    for (const road of floodedRoads) {
      if (road.status === 'blocked') {
        for (const coord of road.coordinates) {
          const gridCell = toGrid(coord[0], coord[1]);
          obstacles.add(`${gridCell.x},${gridCell.y}`);
          // Add padding (buffer)
          obstacles.add(`${gridCell.x+1},${gridCell.y}`);
          obstacles.add(`${gridCell.x-1},${gridCell.y}`);
          obstacles.add(`${gridCell.x},${gridCell.y+1}`);
          obstacles.add(`${gridCell.x},${gridCell.y-1}`);
        }
      }
    }

    // 4. A* Search
    const openSet = [{ x: startGrid.x, y: startGrid.y, g: 0, f: 0 }];
    const cameFrom = new Map<string, {x: number, y: number}>();
    const gScore = new Map<string, number>();
    gScore.set(`${startGrid.x},${startGrid.y}`, 0);

    const heuristic = (x1: number, y1: number, x2: number, y2: number) => {
      // Euclidean distance
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    };

    let reachedEnd = false;

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      if (current.x === endGrid.x && current.y === endGrid.y) {
        reachedEnd = true;
        break;
      }

      const currentKey = `${current.x},${current.y}`;
      const currentG = gScore.get(currentKey) || 0;

      // Neighbors (8 directions)
      const dirs = [
        {dx: 0, dy: 1}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: -1, dy: 0},
        {dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: 1, dy: -1}, {dx: -1, dy: -1}
      ];

      for (const dir of dirs) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const neighborKey = `${nx},${ny}`;

        if (obstacles.has(neighborKey)) continue;

        // Ensure we don't go too far out of bounds
        if (nx < -5 || nx > 50 || ny < -5 || ny > 50) continue;

        const tentativeG = currentG + (dir.dx !== 0 && dir.dy !== 0 ? 1.414 : 1);

        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)!) {
          cameFrom.set(neighborKey, {x: current.x, y: current.y});
          gScore.set(neighborKey, tentativeG);
          const f = tentativeG + heuristic(nx, ny, endGrid.x, endGrid.y);
          openSet.push({ x: nx, y: ny, g: tentativeG, f });
        }
      }
    }

    // 5. Reconstruct path
    const path: RoutePoint[] = [];
    if (reachedEnd) {
      let currKey = `${endGrid.x},${endGrid.y}`;
      path.push(end); // Actual precise end point
      
      let currGrid = cameFrom.get(currKey);
      while (currGrid) {
        if (!(currGrid.x === startGrid.x && currGrid.y === startGrid.y)) {
           path.unshift(fromGrid(currGrid.x, currGrid.y));
        }
        currKey = `${currGrid.x},${currGrid.y}`;
        currGrid = cameFrom.get(currKey);
      }
      path.unshift(start); // Actual precise start point
    } else {
      // Fallback if A* fails to find a path (e.g. completely surrounded)
      path.push(start);
      path.push(end);
    }

    // 6. Calculate distance
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      distance += this.calculateDistance(path[i].lat, path[i].lon, path[i + 1].lat, path[i + 1].lon);
    }

    return { path, distance };
  }

  /**
   * Calculate estimated travel time
   */
  private calculateEstimatedTime(distance: number, safetyScore: number): number {
    // Base speed: 40 km/h
    // Reduced speed for lower safety scores
    const baseSpeed = 40;
    const speedMultiplier = safetyScore / 100;
    const effectiveSpeed = baseSpeed * speedMultiplier;
    return Math.ceil((distance / effectiveSpeed) * 60); // minutes
  }

  /**
   * Find safest evacuation route
   */
  async findSafeRoute(
    userLat: number,
    userLon: number,
    floodedRoads: any[]
  ): Promise<SafeRoute | null> {
    const startTime = Date.now();

    try {
      await this.logActivity('find_safe_route', 'running', { userLat, userLon }, {});

      // Find nearest shelters
      const nearestShelters = await this.findNearestShelters(userLat, userLon, 5);

      if (nearestShelters.length === 0) {
        throw new Error('No available shelters found');
      }

      // Find best route to each shelter
      let bestRoute: SafeRoute | null = null;
      let bestScore = -1;

      for (const shelter of nearestShelters) {
        const start: RoutePoint = { lat: userLat, lon: userLon };
        const end: RoutePoint = { lat: shelter.latitude, lon: shelter.longitude };

        const { path, distance } = this.generateSafeRoute(start, end, floodedRoads);
        const { safetyScore, avoidedHazards } = this.calculateSafetyScore(path, floodedRoads);
        const estimatedTime = this.calculateEstimatedTime(distance, safetyScore);

        // Combined score: prioritize safety, then distance
        const combinedScore = safetyScore * 0.7 + (100 - Math.min(distance * 10, 100)) * 0.3;

        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          bestRoute = {
            routeId,
            path,
            distance,
            safetyScore,
            estimatedTime,
            shelter,
            avoidedHazards,
          };
        }
      }

      if (bestRoute) {
        // Generate AI explanation
        try {
          bestRoute.explanation = await generateAIResponse({
            systemPrompt: `You are an evacuation routing AI. Explain why the suggested route is safest based on flood data. Keep it concise (1-2 sentences).`,
            userPrompt: `Route details:
Distance: ${bestRoute.distance.toFixed(2)}km
Safety Score: ${bestRoute.safetyScore}/100
Avoided Hazards: ${bestRoute.avoidedHazards.join(', ') || 'None'}
Shelter: ${bestRoute.shelter.name}

Explain why this route is safe and suggest taking it.`,
            maxTokens: 150,
            useCache: true,
          });
        } catch (e) {
          console.error('Routing AI explanation failed:', e);
          bestRoute.explanation = 'This route has been calculated as the safest available path avoiding known hazards.';
        }

        // Save route to database
        await adminDb.collection('routes').add({
          routeId: bestRoute.routeId,
          sourceLat: userLat,
          sourceLon: userLon,
          destinationLat: bestRoute.shelter.latitude,
          destinationLon: bestRoute.shelter.longitude,
          distance: bestRoute.distance,
          safetyScore: bestRoute.safetyScore,
          estimatedTime: bestRoute.estimatedTime,
          routePath: bestRoute.path,
          avoidedHazards: bestRoute.avoidedHazards,
          shelterId: bestRoute.shelter.id,
          createdAt: new Date().toISOString()
        });

        const executionTime = Date.now() - startTime;
        await this.logActivity('find_safe_route', 'completed', { userLat, userLon }, bestRoute, undefined, executionTime);
      }

      return bestRoute;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logActivity('find_safe_route', 'failed', { userLat, userLon }, {}, errorMessage, executionTime);
      throw error;
    }
  }

  /**
   * Find alternative routes
   */
  async findAlternativeRoutes(
    userLat: number,
    userLon: number,
    floodedRoads: any[],
    count = 3
  ): Promise<SafeRoute[]> {
    const alternativeRoutes: SafeRoute[] = [];
    const nearestShelters = await this.findNearestShelters(userLat, userLon, count);

    for (const shelter of nearestShelters) {
      const start: RoutePoint = { lat: userLat, lon: userLon };
      const end: RoutePoint = { lat: shelter.latitude, lon: shelter.longitude };

      const { path, distance } = this.generateSafeRoute(start, end, floodedRoads);
      const { safetyScore, avoidedHazards } = this.calculateSafetyScore(path, floodedRoads);
      const estimatedTime = this.calculateEstimatedTime(distance, safetyScore);

      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      alternativeRoutes.push({
        routeId,
        path,
        distance,
        safetyScore,
        estimatedTime,
        shelter,
        avoidedHazards,
      });
    }

    return alternativeRoutes.sort((a: any, b: any) => b.safetyScore - a.safetyScore);
  }
}
