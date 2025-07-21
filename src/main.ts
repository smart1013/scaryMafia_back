import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));
  await app.listen(process.env.PORT ?? 8000);

  // CORS(Cross-Origin Resource Sharing) 설정 추가 
  app.enableCors({  
    origin: 'http://localhost:3000', // 모든 도메인 허용
    credentials: true, // 쿠키를 포함한 요청 허용
  });
  
  //app.useGlobalPipes(new ValidationPipe());

  // 백엔드 서버 8000번 포트로 실행 
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
