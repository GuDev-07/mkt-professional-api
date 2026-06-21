import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Project } from '@prisma/client';
import { memoryStorage } from 'multer';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { ProjectCategory } from '../../enums';
import { UploadImageFile, UploadsService } from '../uploads/uploads.service';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { UpdateProjectRequestDto } from './dto/request/update-project-request.dto';
import { ProjectResponseDto } from './dto/response/project-response.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({
    status: 200,
    description: 'List of projects',
    type: ProjectResponseDto,
    isArray: true,
  })
  async findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  @ApiParam({ name: 'id', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Project found',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string): Promise<Project> {
    const project = await this.projectsService.findOne(BigInt(id));

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return project;
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get projects by category' })
  @ApiParam({ name: 'category', example: 'BRANDING_IDENTIDADE' })
  @ApiResponse({
    status: 200,
    description: 'Projects found by category',
    type: ProjectResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'No projects found for this category',
  })
  async findByCategory(
    @Param('category', new ParseEnumPipe(ProjectCategory))
    category: ProjectCategory,
  ): Promise<Project[]> {
    return this.projectsService.findByCategory(category);
  }

  @Post()
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle({
    default: {
      limit: parsePositiveInt(process.env.UPLOAD_RATE_LIMIT, 30),
      ttl: parsePositiveInt(process.env.UPLOAD_RATE_TTL, 60),
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize:
          (parseInt(process.env.UPLOAD_MAX_MB ?? '1', 10) || 1) * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a project with image upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Campanha5' },
        category: {
          type: 'string',
          example: 'BRANDING_IDENTIDADE',
        },
        description: {
          type: 'string',
          example: 'Promoção especial para teste',
        },
        client: { type: 'string', example: 'Loja Virtual XYZ' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title', 'category', 'description', 'image'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Project created',
    type: ProjectResponseDto,
  })
  async create(
    @UploadedFile() file: unknown,
    @Body() body: CreateProjectRequestDto,
  ): Promise<Project> {
    if (!isUploadImageFile(file)) {
      throw new BadRequestException(
        'Imagem é obrigatória e deve ser jpg ou png',
      );
    }

    const detectedMimeType = detectImageMimeType(file.buffer);
    if (!detectedMimeType) {
      throw new BadRequestException('Arquivo não é uma imagem valida');
    }

    if (!['image/jpeg', 'image/png'].includes(detectedMimeType)) {
      throw new BadRequestException('Tipo de arquivo inválido (jpg/png)');
    }

    if (file.mimetype !== detectedMimeType) {
      throw new BadRequestException('Tipo de arquivo inválido (jpg/png)');
    }

    const result = await this.uploadsService.uploadImage(file);

    body.imageKey = result.key;
    body.imageUrl = result.url;

    return this.projectsService.create(body);
  }

  @Patch(':id')
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle({
    default: {
      limit: parsePositiveInt(process.env.ADMIN_RATE_LIMIT, 100),
      ttl: parsePositiveInt(process.env.ADMIN_RATE_TTL, 60),
    },
  })
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({
    status: 200,
    description: 'Project updated',
    type: ProjectResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProjectRequestDto,
  ): Promise<Project> {
    return this.projectsService.update(BigInt(id), body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard, ThrottlerGuard)
  @Throttle({
    default: {
      limit: parsePositiveInt(process.env.ADMIN_RATE_LIMIT, 100),
      ttl: parsePositiveInt(process.env.ADMIN_RATE_TTL, 60),
    },
  })
  @ApiOperation({ summary: 'Delete a project' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.projectsService.remove(BigInt(id));

    return { message: `Project with id ${id} deleted` };
  }
}

function isUploadImageFile(file: unknown): file is UploadImageFile {
  if (!file || typeof file !== 'object') {
    return false;
  }

  const candidate = file as UploadImageFile;
  return (
    typeof candidate.originalname === 'string' &&
    typeof candidate.mimetype === 'string' &&
    Buffer.isBuffer(candidate.buffer)
  );
}

function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) {
    return null;
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) {
    return 'image/jpeg';
  }

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (isPng) {
    return 'image/png';
  }

  return null;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
