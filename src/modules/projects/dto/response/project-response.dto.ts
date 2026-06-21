import { ApiProperty } from '@nestjs/swagger';
import { EXAMPLE_UUID } from '../../../../common/constants/uuid.example';

export class ProjectResponseDto {
  @ApiProperty({ example: EXAMPLE_UUID })
  id: string;

  @ApiProperty({ example: 'My project title' })
  title: string;

  @ApiProperty({ example: 'web' })
  category: string;

  @ApiProperty({ example: 'A description of the project' })
  description: string;

  @ApiProperty({ example: 'Client name', required: false })
  client?: string;

  @ApiProperty({ example: 'https://example.com/image.png' })
  imageUrl: string;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;
}
