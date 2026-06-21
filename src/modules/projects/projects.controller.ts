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
  ParseUUIDPipe,
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
import { EXAMPLE_UUID } from '../../common/constants/uuid.example';
import { ProjectCategory } from '../../enums';
import { isUploadImageFile } from '../uploads/upload-image.utils';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { UpdateProjectRequestDto } from './dto/request/update-project-request.dto';
import { ProjectResponseDto } from './dto/response/project-response.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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
  @ApiParam({ name: 'id', example: EXAMPLE_UUID })
  @ApiResponse({
    status: 200,
    description: 'Project found',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Project> {
    const project = await this.projectsService.findOne(id);
    if (!project)
      throw new NotFoundException(`Project with id ${id} not found`);
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
      required: ['title', 'category', 'description', 'image'],
      properties: {
        title: { type: 'string', example: 'Campanha5' },
        category: { type: 'string', example: 'BRANDING_IDENTIDADE' },
        description: {
          type: 'string',
          example: 'Promoção especial para teste',
        },
        client: { type: 'string', example: 'Loja Virtual XYZ' },
        image: { type: 'string', format: 'binary' },
      },
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
    return this.projectsService.create(file, body);
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProjectRequestDto,
  ): Promise<Project> {
    return this.projectsService.update(id, body);
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
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.projectsService.remove(id);
    return { message: `Project with id ${id} deleted` };
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
