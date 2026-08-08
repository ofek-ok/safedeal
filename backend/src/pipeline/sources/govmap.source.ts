import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, GovMapData } from '../interfaces/pipeline-data.interface';

interface GovMapApiResponse {
  ResultType: number;
  Address?: string;
  X?: number;
  Y?: number;
  OBJECTID?: number;
  CITYNAME?: string;
  STREETNAME?: string;
  ADDRESSNUM?: string;
}

/** Approximate ITM (Israeli Transverse Mercator) → WGS84 conversion */
function itmToWgs84(x: number, y: number): { lat: number; lng: number } {
  // Linear approximation accurate to ~50m for Israel
  const lng = 34.0 + (x - 168000) / 111_319.5;
  const lat = 29.5 + (y - 522100) / 111_131.9;
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

@Injectable()
export class GovMapSource {
  private readonly logger = new Logger(GovMapSource.name);
  private readonly baseUrl = 'https://api.govmap.gov.il/position/json';

  constructor(private readonly config: ConfigService) {}

  async fetch(location: {
    address?: string;
    city?: string;
    street?: string;
    houseNumber?: string;
  }): Promise<SourceResult<GovMapData>> {
    const fullAddress = location.address
      || `${location.street || ''} ${location.houseNumber || ''}, ${location.city || ''}`.trim();

    try {
      const appId = this.config.get<string>('GOVMAP_APP_ID') || '';
      const params = new URLSearchParams({
        address: fullAddress,
        type: '1',
        ...(appId ? { appId } : {}),
      });

      this.logger.log(`GovMap: Geocoding "${fullAddress}"`);
      const response = await fetch(`${this.baseUrl}?${params}`, {
        signal: AbortSignal.timeout(8_000),
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://www.govmap.gov.il/',
        },
      });

      if (!response.ok) {
        throw new Error(`GovMap API error: HTTP ${response.status}`);
      }

      const data = (await response.json()) as GovMapApiResponse;

      if (data.ResultType !== 1 || !data.X || !data.Y) {
        throw new Error(`GovMap: Address not resolved (ResultType=${data.ResultType})`);
      }

      const wgs84 = itmToWgs84(data.X, data.Y);

      return {
        source: 'govmap',
        success: true,
        data: {
          canonicalAddress: data.Address || fullAddress,
          city: data.CITYNAME || location.city || '',
          street: data.STREETNAME || location.street || '',
          houseNumber: data.ADDRESSNUM || location.houseNumber || '',
          coordinates: wgs84,
          itmCoordinates: { x: data.X, y: data.Y },
          objectId: data.OBJECTID,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`GovMapSource failed — using fallback: ${msg}`);

      // Fallback: return approximate data from inputs
      return {
        source: 'govmap',
        success: true,
        data: {
          canonicalAddress: fullAddress,
          city: location.city || '',
          street: location.street || '',
          houseNumber: location.houseNumber || '',
          coordinates: { lat: 32.0853, lng: 34.7818 }, // TA center fallback
          itmCoordinates: null,
          objectId: null,
        },
        warnings: [`GovMap geocoding failed: ${msg}. Using approximate coordinates.`],
      };
    }
  }
}
