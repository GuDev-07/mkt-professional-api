import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProjectCategory } from '../../../../enums';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
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
}
