import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EXAMPLE_UUID } from '../../../../common/constants/uuid.example';

export class FeedbackResponseDto {
  @ApiProperty({ example: EXAMPLE_UUID })
  id!: string;

  @ApiProperty({ example: 'Juliana Paes' })
  name!: string;

  @ApiPropertyOptional({ example: 'Bloom' })
  company?: string;

  @ApiPropertyOptional({ example: 'Extremamente profissional e criativa.' })
  comment?: string;

  @ApiPropertyOptional({ example: 'Fundadora da Bloom' })
  jobTitle?: string;

  @ApiPropertyOptional({ example: '/media/feedbacks%2F123_uuid.jpg' })
  avatar?: string;
}
