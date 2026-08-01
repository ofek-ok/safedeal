import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumberString,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ──────────────────────────────────────────────
// Shared Enums
// ──────────────────────────────────────────────
export enum City {
  TEL_AVIV = 'tel-aviv',
  JERUSALEM = 'jerusalem',
  HAIFA = 'haifa',
  RISHON_LEZION = 'rishon-lezion',
  HOLON = 'holon',
  PETAH_TIKVA = 'petah-tikva',
  BEER_SHEVA = 'beer-sheva',
  NETANYA = 'netanya',
  ASHDOD = 'ashdod',
  BAT_YAM = 'bat-yam',
  BNEI_BRAK = 'bnei-brak',
  RAMAT_GAN = 'ramat-gan',
  HERZLIYA = 'herzliya',
  KFAR_SABA = 'kfar-saba',
  MODIIN = 'modiin',
  OTHER = 'other',
}

export enum DealType {
  SECOND_HAND = 'second-hand',
  NEW_DEVELOPER = 'new-developer',
}

// ──────────────────────────────────────────────
// Nested DTOs
// ──────────────────────────────────────────────

export class PropertyLocationDto {
  @IsEnum(City, { message: 'עיר לא תקינה' })
  city: City;

  @IsString()
  @IsNotEmpty({ message: 'שם הרחוב הוא שדה חובה' })
  @MaxLength(100)
  streetName: string;

  @IsString()
  @IsNotEmpty({ message: 'מספר הבית הוא שדה חובה' })
  @MaxLength(10)
  houseNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  block?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  parcel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  subParcel?: string;
}

export class PropertyDetailsDto {
  @IsEnum(DealType, { message: 'סוג עסקה לא תקין' })
  dealType: DealType;

  @IsString()
  @IsNotEmpty({ message: 'מחיר מבוקש הוא שדה חובה' })
  askingPrice: string;

  @IsString()
  @IsNotEmpty({ message: 'שטח הדירה הוא שדה חובה' })
  propertyArea: string;

  @IsString()
  @IsNotEmpty({ message: 'מספר חדרים הוא שדה חובה' })
  roomsCount: string;

  @IsString()
  @IsNotEmpty({ message: 'קומה הוא שדה חובה' })
  floorNumber: string;

  @IsBoolean()
  hasParking: boolean;

  @IsBoolean()
  hasStorage: boolean;

  @IsOptional()
  @IsString()
  monthlyRent?: string;
}

export class DocumentMetaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tabuFileName?: string | null;

  @IsArray()
  @IsString({ each: true })
  additionalDocNames: string[];
}

// ──────────────────────────────────────────────
// Root DTO
// ──────────────────────────────────────────────
export class CreatePropertyAnalysisDto {
  @ValidateNested()
  @Type(() => PropertyLocationDto)
  location: PropertyLocationDto;

  @ValidateNested()
  @Type(() => PropertyDetailsDto)
  details: PropertyDetailsDto;

  @ValidateNested()
  @Type(() => DocumentMetaDto)
  documents: DocumentMetaDto;
}
