import { Global, Module } from '@nestjs/common';
import * as Minio from 'minio';
import { MinioController } from './minio.controller';
import { MINIO_CLIENT } from './minio.constants';
import { MinioService } from './minio.service';
@Global()
@Module({
  providers: [
    MinioService,
    {
      provide: MINIO_CLIENT,
      async useFactory() {
        const client = new Minio.Client({
          endPoint: 'indulger.cn',
          port: 9000,
          useSSL: false,
          accessKey: 's2bOHbhDKZYmTpMUKMTy',
          secretKey: 'lAm5XHxYUi2NDsV8c0uBvdUb1vbGnGEFERdD33tA',
        });
        return client;
      },
    },
  ],
  controllers: [MinioController],
  exports: [MINIO_CLIENT, MinioService],
})
export class MinioModule {}
