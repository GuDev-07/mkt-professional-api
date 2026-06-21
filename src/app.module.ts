import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { UploadsModule } from './modules/uploads/uploads.module';

const IS_DEV = (process.env.NODE_ENV ?? 'development') === 'development';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: IS_DEV ? 'debug' : 'info',
        transport: IS_DEV
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
        redact: ['req.headers.authorization'],
        serializers: {
          req(req) {
            return {
              method: req.method,
              url: req.url,
              userId: (req.raw as { user?: { id?: string } }).user?.id,
            };
          },
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parsePositiveInt(process.env.RATE_LIMIT_TTL, 60),
        limit: parsePositiveInt(process.env.RATE_LIMIT_MAX, 120),
      },
    ]),
    ProjectsModule,
    TimelineModule,
    FeedbacksModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntInterceptor,
    },
  ],
})
export class AppModule {}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
