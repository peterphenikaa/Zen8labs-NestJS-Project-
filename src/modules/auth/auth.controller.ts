import { Body, Controller, Get, Post, UseGuards, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ValidationPipe } from '../../pipes/validation.pipe';
import { AuthRequest } from './auth.request.dto';
import { ApiResponse, TApiResponse } from 'src/common/bases/api.reponse';
import { ILoginResponse } from './auth.interface';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body(new ValidationPipe()) authRequest: AuthRequest, @Req() request: Request): Promise<TApiResponse<ILoginResponse>> {
    try {
      const response = await this.authService.authenticate(authRequest, request);
      return ApiResponse.ok(response, "Đăng nhập thành công", HttpStatus.OK); 
    } catch(error) {
      return ApiResponse.error(error, "Có vấn đề xảy ra", HttpStatus.BAD_REQUEST)
    }
  }
}


