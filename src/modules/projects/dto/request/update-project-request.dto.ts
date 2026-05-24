import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ProjectCategory } from '../../../../enums';
import { CreateProjectRequestDto } from './create-project-request.dto';

export class UpdateProjectRequestDto extends PartialType(
  CreateProjectRequestDto,
) {
  @ApiPropertyOptional({ example: 'My project title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ProjectCategory })
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @ApiPropertyOptional({ example: 'A description of the project' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Client name' })
  @IsOptional()
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
