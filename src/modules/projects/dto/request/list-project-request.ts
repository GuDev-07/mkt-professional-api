import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ProjectCategory } from '../../../../enums';

export class ProjectResponseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  client?: string;

  @IsString()
  @IsUrl()
  @Expose({ name: 'image_url' })
  imageUrl: string;
}
