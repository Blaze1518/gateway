import {
  BadRequestException,
  Injectable,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = this.formatErrors(errors);
        return new BadRequestException(formattedErrors);
      },
    });
  }
  private formatErrors(errors: ValidationError[]) {
    return errors.map((err) => {
      return {
        property: err.property,
        message: Object.values(err.constraints || {})[0],
      };
    });
  }
}
