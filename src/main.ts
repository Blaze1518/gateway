import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupSwagger } from './config/swagger/swagger.config';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  try {
    logger.log('Khởi tạo ứng dụng...');
    const app = await NestFactory.create(AppModule, {
      logger: logger,
      abortOnError: false,
    });
    const configService = app.get(ConfigService);
    const globalPrefix = configService.get<string>('GLOBAL_PREFIX') || '';
    const frontendUrl = configService.get<string>('FRONTEND_URL') || '';

    app.setGlobalPrefix(globalPrefix);
    const httpAdapterHost = app.get(HttpAdapterHost);

    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalInterceptors(new TransformInterceptor());

    // app.enableCors({
    //   origin: frontendUrl,
    //   credentials: true,
    // });

    app.enableCors({
      origin: '*', // Cho phép tất cả các domain gọi tới API
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: false, // Bắt buộc để false nếu origin là '*'
    });

    setupSwagger(app);

    await app.listen(process.env.PORT ?? 3001);
  } catch (error) {}
}
bootstrap();
