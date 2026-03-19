import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class FeedbackResponseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsString()
  @IsUrl()
  @Expose({ name: 'avatar_url' })
  avatarUrl?: string;
}
