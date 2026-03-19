import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateFeedbackRequestDto {
  @ApiProperty({ example: 'Michelle' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Esc Empreendimentos' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ example: 'Great service!' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({ example: 'https://example.com/image.png' })
  @IsString()
  @IsUrl()
  @Expose({ name: 'avatar_url' })
  avatar: string;
}
