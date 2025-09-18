import { Body, Controller, Get, Post, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {ValidationPipe } from '../../pipes/validation.pipe';
import { AuthRequest } from './auth.request.dto';
import { ApiResponse, TApiResponse } from 'src/common/bases/api.reponse';
import { ILoginResponse } from './auth.interface';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body(new ValidationPipe()) request: AuthRequest): Promise<TApiResponse<ILoginResponse>> {
    try {
      const response = await this.authService.authenticate(request);
      return ApiResponse.ok(response, "Đăng nhập thành công", HttpStatus.OK); 
    } catch(error) {
      return ApiResponse.error(error, "Có vấn đề xảy ra", HttpStatus.BAD_REQUEST)
    }
  }
}
