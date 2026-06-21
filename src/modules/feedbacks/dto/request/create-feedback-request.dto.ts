import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { pickStringFromTransform } from './feedback-field.utils';

export class CreateFeedbackRequestDto {
  @ApiProperty({ example: 'Juliana Paes' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Bloom' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Extremamente profissional e criativa.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    example: 'Fundadora da Bloom',
    description: 'Accepts jobTitle or job_title',
  })
  @IsOptional()
  @IsString()
  @Transform(pickStringFromTransform('jobTitle', 'job_title'))
  jobTitle?: string;

  avatarKey?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  @IsUrl()
  @Transform(pickStringFromTransform('avatarUrl', 'avatar_url'))
  avatarUrl?: string;
}
