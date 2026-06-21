import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { pickStringFromTransform } from './feedback-field.utils';

export class UpdateFeedbackRequestDto {
  @ApiPropertyOptional({ example: 'Juliana Paes' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Bloom' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Extremamente profissional e criativa.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: 'Fundadora da Bloom' })
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
