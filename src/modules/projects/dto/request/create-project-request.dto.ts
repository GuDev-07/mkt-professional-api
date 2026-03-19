import { ApiProperty } from '@nestjs/swagger';
import { ProjectCategory } from '../../../../enums';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateProjectRequestDto {
  @ApiProperty({ example: 'My project title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: ProjectCategory.BRANDING_IDENTIDADE,
    enum: ProjectCategory,
  })
  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @ApiProperty({ example: 'A description of the project' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Client name', required: false })
  @IsString()
  client?: string;

  @ApiProperty({ example: 'https://example.com/image.png' })
  @IsString()
  @IsUrl()
  @Expose({ name: 'image_url' })
  imageUrl: string;
}
