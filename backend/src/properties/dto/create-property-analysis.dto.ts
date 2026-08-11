import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
  IsArray,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO that exactly mirrors the frontend WizardFormData structure.
 * Frontend sends: { personal, location, deal, documents }
 */

export class PersonalDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() purpose?: string;
  @IsOptional() @IsBoolean() agreeToTerms?: boolean;
  @IsOptional() @IsString() idNumber?: string;
}

export class LocationDto {
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) street?: string;
  @IsOptional() @IsString() @MaxLength(100) streetName?: string; // legacy alias
  @IsOptional() @IsString() @MaxLength(20) houseNumber?: string;
  @IsOptional() @IsString() @MaxLength(20) block?: string;
  @IsOptional() @IsString() @MaxLength(20) parcel?: string;
  @IsOptional() @IsString() @MaxLength(20) subParcel?: string;
}

export class DealDto {
  @IsOptional() @IsString() dealType?: string;
  @IsOptional() @IsString() askingPrice?: string;
  @IsOptional() @IsString() propertyArea?: string;
  @IsOptional() @IsString() roomsCount?: string;
  @IsOptional() @IsString() floorNumber?: string;
  @IsOptional() @IsBoolean() hasParking?: boolean;
  @IsOptional() @IsBoolean() hasStorage?: boolean;
  @IsOptional() @IsBoolean() hasMamad?: boolean;
  @IsOptional() @IsBoolean() hasElevator?: boolean;
  @IsOptional() @IsString() monthlyRent?: string;
}

export class DocumentsDto {
  @IsOptional() @IsString() @MaxLength(255) tabuFileName?: string | null;
  @IsOptional() @IsString() @MaxLength(255) buildingFileName?: string | null;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalDocNames?: string[];
}

export class CreatePropertyAnalysisDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalDto)
  personal?: PersonalDto;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  // Frontend sends as "deal", legacy support for "details"
  @IsOptional()
  @ValidateNested()
  @Type(() => DealDto)
  deal?: DealDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DealDto)
  details?: DealDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentsDto)
  documents?: DocumentsDto;
}
