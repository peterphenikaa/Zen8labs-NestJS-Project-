import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Kiểm tra token từ cookie
    const accessToken = request.cookies?.accessToken;
    
    if (!accessToken) {
      // Nếu đây là request cho HTML page, redirect về login
      if (request.headers.accept?.includes('text/html')) {
        response.redirect('/v1/auth/login');
        return false;
      }
      throw new UnauthorizedException('Token không hợp lệ');
    }
    
    try {
      const payload = this.jwtService.verify(accessToken);
      request['user'] = payload;
      return true;
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ
      if (request.headers.accept?.includes('text/html')) {
        response.redirect('/v1/auth/login');
        return false;
      }
      throw new UnauthorizedException('Token đã hết hạn');
    }
  }
}
