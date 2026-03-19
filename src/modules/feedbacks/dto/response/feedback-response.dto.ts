import { ApiProperty } from '@nestjs/swagger';

export class FeedbackResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Name of person' })
  name: string;

  @ApiProperty({ example: 'Esc Empreendimentos' })
  company: string;

  @ApiProperty({ example: 'Great service!' })
  comment: string;

  @ApiProperty({ example: 'https://example.com/image.png' })
  avatarUrl: string;
}
