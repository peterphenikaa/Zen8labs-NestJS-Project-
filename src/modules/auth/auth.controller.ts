import { Body, Controller, Get, Post, UseGuards, HttpStatus, Req, Render, Res, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ValidationPipe } from '../../pipes/validation.pipe';
import { AuthRequest } from './auth.request.dto';
import { ApiResponse, TApiResponse } from 'src/common/bases/api.reponse';
import { ILoginResponse } from './auth.interface';
import { AuthGuard } from './auth.guard';

@Controller('v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body(new ValidationPipe()) authRequest: AuthRequest, @Req() request: Request, @Res() res: Response) {
    try {
      const response = await this.authService.authenticate(authRequest, request);
      
      // Lưu token vào cookie để server có thể kiểm tra
      res.cookie('accessToken', response.accessToken, { 
        httpOnly: true, 
        secure: false, // Set true nếu dùng HTTPS
        maxAge: 15 * 1000 // 15 giây
      });
      
      res.cookie('refreshToken', response.refreshToken, { 
        httpOnly: true, 
        secure: false, // Set true nếu dùng HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
      });
      
      // Render trang dashboard với token data để JavaScript có thể lưu vào localStorage
      return res.render('dashboard', { 
        tokenData: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt,
          tokenType: response.tokenType,
          crsfToken: response.crsfToken
        }
      });
    } catch(error) {
      // Nếu có lỗi, render lại trang login với thông báo lỗi
      return res.render('login', { 
        error: error.message || "Có vấn đề xảy ra khi đăng nhập" 
      });
    }
  }
  

  @Post('/refresh')
  async refresh(@Body() body: { refreshToken: string }, @Req() request: Request): Promise<TApiResponse<ILoginResponse>> {
    this.logger.log(`Received /refresh body: ${JSON.stringify(body)}`);
    try {
      const response = await this.authService.refreshToken(body.refreshToken, request);
      this.logger.log(`AuthService.refreshToken returned response for token ${body.refreshToken}: ${JSON.stringify(response)}`);
      return ApiResponse.ok(response, "Token đã được làm mới", HttpStatus.OK);
    } catch(error) {
      this.logger.error(`Lỗi khi xử lý refresh token: ${body?.refreshToken}`, error?.stack || error);
      return ApiResponse.error(error, "Token không hợp lệ", HttpStatus.UNAUTHORIZED)
    }
  }

  @Post('/logout')
  async logout(@Body() body: { refreshToken: string }, @Req() request: Request, @Res() res: Response) {
    try {
      // Gọi service để xóa refresh token khỏi cache
      await this.authService.logout(body.refreshToken, request);
      
      // Xóa cookie
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      // Trả về JSON response thay vì redirect
      return res.json({ 
        success: true, 
        message: "Đăng xuất thành công" 
      });
    } catch(error) {
      // Vẫn xóa cookie và trả về response
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.json({ 
        success: true, 
        message: "Đăng xuất thành công" 
      });
    }
  }

  @Post('/register')
  async register(@Body(new ValidationPipe()) authRequest: AuthRequest): Promise<TApiResponse<{ message: string }>> {
    try {
      await this.authService.register(authRequest);
      return ApiResponse.ok({ message: "Đăng ký thành công" }, "Tài khoản đã được tạo", HttpStatus.CREATED);
    } catch(error) {
      return ApiResponse.error(error, "Có vấn đề xảy ra", HttpStatus.BAD_REQUEST)
    }
  }

  @Get('login')
  @Render('login')
  getLoginForm() {
    return {};
  }

  @Get('dashboard')
  @UseGuards(AuthGuard)
  @Render('dashboard')
  getDashboard() {
    return {};
  }

  @Get('')
  @Render('index')
  getIndex() {
    return {};
  }
}


