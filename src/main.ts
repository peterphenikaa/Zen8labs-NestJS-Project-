import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('pug');
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter())
 
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();



