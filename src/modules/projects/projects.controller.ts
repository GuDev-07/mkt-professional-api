import {
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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Project } from '@prisma/client';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { ProjectCategory } from '../../enums';
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
  @ApiParam({ name: 'id', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Project found',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: number): Promise<Project> {
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
  async findByCategory(
    @Param('category', new ParseEnumPipe(ProjectCategory))
    category: ProjectCategory,
  ): Promise<Project[]> {
    return this.projectsService.findByCategory(category);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a project' })
  @ApiResponse({
    status: 201,
    description: 'Project created',
    type: ProjectResponseDto,
  })
  async create(@Body() body: CreateProjectRequestDto): Promise<Project> {
    return this.projectsService.create(body);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete a project' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.projectsService.remove(BigInt(id));

    return { message: `Project with id ${id} deleted` };
  }
}
