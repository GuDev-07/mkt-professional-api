import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: parsePositiveInt(process.env.RATE_LIMIT_TTL, 60),
      limit: parsePositiveInt(process.env.RATE_LIMIT_MAX, 120),
    }),
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
