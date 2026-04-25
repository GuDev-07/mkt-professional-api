/* eslint-disable @typescript-eslint/unbound-method */

import { NotFoundException } from '@nestjs/common';
import { ProjectCategory } from '../../../enums';
import { PrismaService } from '../../../prisma/prisma.service';
import { FindByCategoryUseCase } from '../use-cases/find-by-category.usecase';

describe('FindByCategoryUseCase (unit)', () => {
  const prismaMock = {
    project: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const useCase = new FindByCategoryUseCase(prismaMock);

  afterEach(() => jest.clearAllMocks());

  it('returns projects when category has data', async () => {
    const projects = [
      {
        id: BigInt(1),
        title: 'Projeto 1',
        category: ProjectCategory.BRANDING_IDENTIDADE,
        description: 'Descricao',
        client: 'Cliente',
        imageUrl: 'http://img',
        createdAt: new Date(),
      },
    ];

    (prismaMock.project.findMany as jest.Mock).mockResolvedValue(projects);

    const result = await useCase.execute(ProjectCategory.BRANDING_IDENTIDADE);

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: { category: ProjectCategory.BRANDING_IDENTIDADE },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(projects);
  });

  it('throws NotFoundException when category has no projects', async () => {
    (prismaMock.project.findMany as jest.Mock).mockResolvedValue([]);

    await expect(
      useCase.execute(ProjectCategory.BRANDING_IDENTIDADE),
    ).rejects.toThrow(
      new NotFoundException('Nenhum projeto esta postado para essa categoria'),
    );
  });
});
