import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MediaController } from './media.controller';
import { S3StorageService } from './s3-storage.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AuthModule],
  controllers: [MediaController, UploadsController],
  providers: [UploadsService, S3StorageService],
  exports: [UploadsService, S3StorageService],
})
export class UploadsModule {}
