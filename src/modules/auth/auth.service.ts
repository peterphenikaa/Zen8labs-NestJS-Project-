import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRequest } from './auth.request.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from '../user/user.interface';
import { ILoginResponse } from './auth.interface';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async authenticate(request: AuthRequest): Promise<unknown> {
    const user = await this.validateUser(request.email, request.password);
    if(!user) {
      throw new UnauthorizedException("Email hoặc mật khẩu không chính xác")
    }
    console.log(request);
    return 'attemp trong auth service';
  }

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email } // email user nhập, input đầu vào 
    })
    if(!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password) 
    if(!isPasswordValid) {
      return null;
    }
    const {password: _, ...result} = user
    // password: _ là cú pháp object destructing
    // ...result rest operator 
    // bỏ key password trong object user, các key còn lại gom vào result 
    return result; 
  }

}
