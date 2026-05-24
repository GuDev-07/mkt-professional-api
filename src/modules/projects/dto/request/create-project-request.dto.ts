import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ProjectCategory } from '../../../../enums';

export class CreateProjectRequestDto {
  @ApiProperty({ example: 'My project title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: ProjectCategory.BRANDING_IDENTIDADE,
    enum: ProjectCategory,
  })
  @IsEnum(ProjectCategory)
  category!: ProjectCategory;

  @ApiProperty({ example: 'A description of the project' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'Client name', required: false })
  @IsString()
  client?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsOptional()
  @IsString()
  @IsUrl()
  @Expose({ name: 'image_url' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'projects/1714760000000_uuid.png' })
  @IsOptional()
  @IsString()
  @Expose({ name: 'image_key' })
  imageKey?: string;
}
