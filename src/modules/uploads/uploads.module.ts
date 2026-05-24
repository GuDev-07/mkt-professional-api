import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MediaController } from './media.controller';
import { S3StorageService } from './s3-storage.service';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [UploadsService, S3StorageService],
  exports: [UploadsService],
})
export class UploadsModule {}
