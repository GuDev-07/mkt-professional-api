import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';

interface CacheEntry {
  userId: string;
  isAdmin: boolean;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private supabase: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token ausente');
    }

    const token = authHeader.replace('Bearer ', '');

    const cached = this.getFromCache(token);
    if (cached) {
      if (!cached.isAdmin) {
        throw new ForbiddenException('Acesso restrito a admin');
      }
      request.user = { id: cached.userId } as Request['user'];
      return true;
    }

    const { data, error } = await this.supabase.client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: data.user.id },
      select: { role: true },
    });

    if (!profile) {
      throw new ForbiddenException('Perfil não encontrado para este usuário');
    }

    const isAdmin =
      Boolean(profile.role) && profile.role.toUpperCase() === 'ADMIN';

    this.setInCache(token, data.user.id, isAdmin);

    if (!isAdmin) {
      this.logger.warn(`Acesso negado para userId=${data.user.id}`);
      throw new ForbiddenException('Acesso restrito a admin');
    }

    this.logger.log(`Auth OK userId=${data.user.id} (via Supabase+DB)`);
    request.user = data.user;
    return true;
  }

  private getFromCache(token: string): CacheEntry | null {
    const entry = this.cache.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(token);
      return null;
    }
    return entry;
  }

  private setInCache(token: string, userId: string, isAdmin: boolean): void {
    const ttlMs = parseTtlMs(
      process.env.ADMIN_GUARD_CACHE_TTL_SECONDS,
      DEFAULT_CACHE_TTL_MS,
    );
    this.cache.set(token, {
      userId,
      isAdmin,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

function parseTtlMs(value: string | undefined, fallbackMs: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : fallbackMs;
}
