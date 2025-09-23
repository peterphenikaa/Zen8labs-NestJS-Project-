import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
// createKeyv (từ @keyv/redis): hàm helper để tạo connection tới Redis cho Keyv.
import { Keyv } from 'keyv';
// Keyv: thư viện cho key-value storage, có thể dùng nhiều backend (Redis, Memory, MongoDB...).
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    AuthModule,
  // ChatModule removed
    CacheModule.registerAsync({
      isGlobal: true,
      // NestJS sẽ tạo ra một provider đặc biệt có token là CACHE_MANAGER
      useFactory: () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
              namespace: 'nestjs-memory-cache' // chưa hiểu 
            }),
            createKeyv('redis://localhost:6379/1', {
              namespace: 'nestjs_newbie' // chưa hiểu 
            }),
          ],
        };
      },
    }),

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
