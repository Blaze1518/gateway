import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as basicAuth from 'express-basic-auth';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);

  const swaggerUser = configService.get<string>('SWAGGER_USER', 'admin');
  const swaggerPass = configService.get<string>('SWAGGER_PASS', 'default-pass');
  const localServer = configService.get<string>(
    'SWAGGER_SERVER_LOCAL',
    'http://localhost:3010/',
  );
  const stagingServer = configService.get<string>(
    'SWAGGER_SERVER_STAGING',
    'https://yourdomain.com',
  );

  app.use(
    ['/api-docs', '/api-docs-json'],
    basicAuth.default({
      challenge: true,
      realm: 'My App API Docs',
      users: {
        [swaggerUser]: swaggerPass,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ATT-Automation')
    .setDescription('Tài liệu API chi tiết cho dự án')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập mã token vào đây',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer(localServer, 'Local environment')
    .addServer(stagingServer, 'Staging')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = join(process.cwd(), 'swagger-spec.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  const themeName = 'theme-newspaper';
  const themeUrl = `https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/${themeName}.css`;

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
    },
    customSiteTitle: 'API Documentation',
    customCssUrl: themeUrl,
    customfavIcon: 'https://nestjs.com/logo-small-gradient.0ed287ce.svg',
  });
}
