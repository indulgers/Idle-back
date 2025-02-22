import { Global, Module } from '@nestjs/common';
import * as Minio from 'minio';

export const MINIO_CLIENT = 'MINIO_CLIENT';

@Global()
@Module({
  providers: [
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
  exports: [MINIO_CLIENT],
})
export class MinioModule {}
