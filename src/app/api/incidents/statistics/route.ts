import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Incident } from '@/lib/types';
import { Neighborhood } from '@/lib/neighborhoodService';

type StatType = 'day' | 'week' | 'month' | 'weekday-distribution' | 'hour-distribution' | 'rate' | 'tag' | 'heat-map-density';

interface StatisticsRequest {
  neighborhoodId?: string;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  tag?: string;
  stats: StatType[];
}

interface MongoQuery {
  date: {
    $gte: string;
    $lte: string;
  };
  time?: {
    $gte?: string;
    $lte?: string;
  };
  tags?: string;
  location?: {
    $geoWithin: {
      $geometry: {
        type: string;
        coordinates: number[][][][];
      };
    };
  };
}

interface StatisticsResults {
  day?: {
    dates: string[];
    counts: number[];
    rollingAverage: number[];
  };
  week?: {
    weeks: string[];
    counts: number[];
    rollingAverage: number[];
  };
  month?: {
    months: string[];
    counts: number[];
  };
  weekdayDistribution?: {
    weekdays: string[];
    counts: number[];
  };
  hourDistribution?: {
    hours: number[];
    counts: number[];
  };
  tag?: {
    tags: string[];
    counts: number[];
  };
  heatMapDensity?: {
    density: number; // incidents per km²
    totalIncidents: number;
    area: number; // area in km²
  };
  rate?: {
    totalIncidents: number;
  };
}

function calculateRollingAverage(data: number[], windowSize: number = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: StatisticsRequest = {
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      timeFrom: searchParams.get('timeFrom') || undefined,
      timeTo: searchParams.get('timeTo') || undefined,
      neighborhoodId: searchParams.get('neighborhoodId') || undefined,
      tag: searchParams.get('tag') || undefined,
      stats: (searchParams.get('stats') || '').split(',') as StatType[],
    };

    // Validate required parameters
    const missingParams = [];
    if (!params.dateFrom) missingParams.push('dateFrom');
    if (!params.dateTo) missingParams.push('dateTo');
    if (params.stats.length === 0) missingParams.push('stats');

    if (missingParams.length > 0) {
      return NextResponse.json({
        error: 'Missing required parameters',
        missingParams,
        receivedParams: params
      }, { status: 400 });
    }

    // Check if neighborhoodId is required for heat-map-density
    if (params.stats.includes('heat-map-density') && !params.neighborhoodId) {
      return NextResponse.json(
        {
          error: 'neighborhoodId is required for heat-map-density calculation',
          receivedParams: params
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const incidentsCollection = db.collection('incident_draft');
    const neighborhoodsCollection = db.collection('neighborhoods');

    // Build query
    const query: MongoQuery = {
      date: {
        $gte: params.dateFrom,
        $lte: params.dateTo,
      },
    };

    // Handle neighborhood filtering using $geoWithin
    if (params.neighborhoodId) {
      try {
        // Try to convert to number since properties.id is numeric
        const neighborhoodIdNum = parseInt(params.neighborhoodId, 10);

        // Find the neighborhood - could be numeric ID from properties
        const neighborhood = await neighborhoodsCollection.findOne({
          'properties.id': isNaN(neighborhoodIdNum) ? params.neighborhoodId : neighborhoodIdNum
        });

        if (neighborhood && neighborhood.geometry) {
          // Filter incidents by location within the neighborhood polygon
          query.location = {
            $geoWithin: {
              $geometry: neighborhood.geometry
            }
          };
        } else {
          return NextResponse.json(
            { error: `Neighborhood with ID ${params.neighborhoodId} not found` },
            { status: 404 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Error processing neighborhood filter' },
          { status: 500 }
        );
      }
    }

    if (params.timeFrom || params.timeTo) {
      query.time = {};
      if (params.timeFrom) query.time.$gte = params.timeFrom;
      if (params.timeTo) query.time.$lte = params.timeTo;
    }

    if (params.tag) {
      query.tags = params.tag;
    }

    const incidents = await incidentsCollection.find(query).toArray();
    console.log(`Found ${incidents.length} incidents matching query`);

    const results: StatisticsResults = {};

    for (const stat of params.stats) {
      switch (stat) {
        case 'day':
          const dailyStats = new Map<string, number>();
          incidents.forEach((incident: Incident) => {
            const date = incident.date;
            dailyStats.set(date, (dailyStats.get(date) || 0) + 1);
          });
          results.day = {
            dates: Array.from(dailyStats.keys()),
            counts: Array.from(dailyStats.values()),
            rollingAverage: calculateRollingAverage(Array.from(dailyStats.values())),
          };
          break;

        case 'week':
          const weeklyStats = new Map<string, number>();
          incidents.forEach((incident: Incident) => {
            const date = new Date(incident.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            weeklyStats.set(weekKey, (weeklyStats.get(weekKey) || 0) + 1);
          });
          results.week = {
            weeks: Array.from(weeklyStats.keys()),
            counts: Array.from(weeklyStats.values()),
            rollingAverage: calculateRollingAverage(Array.from(weeklyStats.values())),
          };
          break;

        case 'month':
          const monthlyStats = new Map<string, number>();
          incidents.forEach((incident: Incident) => {
            const date = new Date(incident.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyStats.set(monthKey, (monthlyStats.get(monthKey) || 0) + 1);
          });
          results.month = {
            months: Array.from(monthlyStats.keys()),
            counts: Array.from(monthlyStats.values()),
          };
          break;

        case 'weekday-distribution':
          const weekdayStats = new Array(7).fill(0);
          incidents.forEach((incident: Incident) => {
            const date = new Date(incident.date);
            weekdayStats[date.getDay()]++;
          });
          results.weekdayDistribution = {
            weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            counts: weekdayStats,
          };
          break;

        case 'hour-distribution':
          const hourStats = new Array(24).fill(0);
          incidents.forEach((incident: Incident) => {
            const time = incident.time.split(':')[0];
            hourStats[parseInt(time)]++;
          });
          results.hourDistribution = {
            hours: Array.from({ length: 24 }, (_, i) => i),
            counts: hourStats,
          };
          break;

        case 'tag':
          const tagStats = new Map<string, number>();
          incidents.forEach((incident: Incident) => {
            incident.tags?.forEach(tag => {
              tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
            });
          });
          results.tag = {
            tags: Array.from(tagStats.keys()),
            counts: Array.from(tagStats.values()),
          };
          break;

        case 'heat-map-density':
          if (!params.neighborhoodId) {
            continue;
          }

          // Get neighborhood data (we already have it from the filtering step)
          const neighborhoodIdNum = parseInt(params.neighborhoodId, 10);
          const neighborhood = await neighborhoodsCollection.findOne({
            'properties.id': isNaN(neighborhoodIdNum) ? params.neighborhoodId : neighborhoodIdNum
          });

          if (!neighborhood) {
            return NextResponse.json(
              { error: `Neighborhood with ID ${params.neighborhoodId} not found` },
              { status: 404 }
            );
          }

          // Convert hectares to square kilometers
          const areaInKm2 = neighborhood.properties.hectares / 100;

          // Calculate density (incidents per km²)
          const totalIncidents = incidents.length;
          const density = totalIncidents / areaInKm2;

          results.heatMapDensity = {
            density,
            totalIncidents,
            area: areaInKm2,
          };
          break;

        case 'rate':
          // This would require population data for the neighborhood
          // For now, we'll return the raw incident count
          results.rate = {
            totalIncidents: incidents.length,
            // Note: Actual rate calculation would require population data
          };
          break;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
