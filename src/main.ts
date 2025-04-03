import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Main - Orders');
  const app = await NestFactory.create(AppModule);
  await app.listen(envs.PORT);
  logger.log(`Orders Microservice Running on port ${ envs.PORT }`);
}
bootstrap();