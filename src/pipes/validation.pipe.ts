import { PipeTransform, Injectable, ArgumentMetadata, HttpException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../common/bases/api.reponse';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    const formatErrors = this.formatErrors(errors);

    if (errors.length > 0) {
      const response = ApiResponse.error(formatErrors, "Failed", HttpStatus.BAD_REQUEST);
      
      throw new HttpException(response, HttpStatus.BAD_REQUEST);
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(error: ValidationError[]) {
    const result = {}
    error.forEach(error => {
      if(error.constraints) {
        result[error.property] = Object.values(error.constraints) 
      }
    })
    return result;
  }
}
