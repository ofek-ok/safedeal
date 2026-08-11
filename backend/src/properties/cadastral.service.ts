import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GovMapGeocodeResponse {
  ResultType: number;
  X?: number;
  Y?: number;
}

interface GovMapIntersectResponse {
  data?: {
    PARCEL_ALL?: {
      GUSH_NUM?: string;
      PARCEL?: string;
    }[];
  };
}

@Injectable()
export class CadastralService {
  private readonly logger = new Logger(CadastralService.name);

  constructor(private readonly config: ConfigService) {}

  async lookup(city: string, street: string, houseNumber: string) {
    if (!city || !street || !houseNumber) {
      throw new HttpException(
        'עיר, רחוב ומספר בית הם שדות חובה.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const fullAddress = `${street.trim()} ${houseNumber.trim()}, ${city.trim()}`;
    const appId = this.config.get<string>('GOVMAP_APP_ID') || '';

    try {
      // Step 1: Geocode the address to X, Y
      const params = new URLSearchParams({
        address: fullAddress,
        type: '1',
        ...(appId ? { appId } : {}),
      });

      this.logger.log(`Cadastral Lookup: Geocoding "${fullAddress}"`);
      const geoResponse = await fetch(
        `https://api.govmap.gov.il/position/json?${params}`,
        {
          headers: {
            Accept: 'application/json',
            Referer: 'https://www.govmap.gov.il/',
          },
        },
      );

      if (!geoResponse.ok) {
        throw new Error(`GovMap geocode failed: HTTP ${geoResponse.status}`);
      }

      const geoData = (await geoResponse.json()) as GovMapGeocodeResponse;

      if (geoData.ResultType !== 1 || !geoData.X || !geoData.Y) {
        throw new HttpException(
          'לא הצלחנו לאתר את הקואורדינטות של הכתובת הזו.',
          HttpStatus.NOT_FOUND,
        );
      }

      // Step 2: Intersect X, Y with PARCEL_ALL layer
      this.logger.log(
        `Cadastral Lookup: Intersecting X=${geoData.X}, Y=${geoData.Y}`,
      );
      const intersectUrl = `https://api.govmap.gov.il/intersect?x=${geoData.X}&y=${geoData.Y}&layers=PARCEL_ALL`;
      const intersectResponse = await fetch(intersectUrl, {
        headers: {
          Accept: 'application/json',
          Referer: 'https://www.govmap.gov.il/',
        },
      });

      if (!intersectResponse.ok) {
        throw new Error(
          `GovMap intersect failed: HTTP ${intersectResponse.status}`,
        );
      }

      const intersectData =
        (await intersectResponse.json()) as GovMapIntersectResponse;
      const parcels = intersectData.data?.PARCEL_ALL;

      if (!parcels || parcels.length === 0) {
        throw new HttpException(
          'לא נמצאו נתוני גוש/חלקה רשמיים בנקודה זו.',
          HttpStatus.NOT_FOUND,
        );
      }

      // Return the first intersecting parcel
      const firstParcel = parcels[0];
      return {
        block: firstParcel.GUSH_NUM || '',
        parcel: firstParcel.PARCEL || '',
      };
    } catch (err: any) {
      this.logger.error(`Cadastral Lookup Error: ${err.message}`);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'שגיאה בתקשורת מול מאגרי משרד הפנים.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
