import { Global, Module } from '@nestjs/common';
import { ChromaService } from './chroma.service';
@Global()
@Module({
  providers: [ChromaService],
  exports: [ChromaService],
})
export class ChromaModule {}
