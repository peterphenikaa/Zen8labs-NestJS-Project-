import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthRequest } from './auth.request.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from '../user/user.interface';
import { ILoginResponse, IJwtPayload } from './auth.interface';
import { JwtService } from '@nestjs/jwt'; // header + payload + signature 
import { randomBytes } from 'crypto'; 
// randomBytes tạo ra 1 chuỗi byte ngẫu nhiên với độ dài định nghĩa 
// thường dùng tạo secret key, token
// crypto cung cấp các hàm liên quan đến mã hóa, băm, hash 
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService,
              private readonly jwtService: JwtService,
              @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async authenticate(request: AuthRequest): Promise<ILoginResponse> {
    const user = await this.validateUser(request.email, request.password);
    if(!user) {
        throw new UnauthorizedException("Email hoặc mật khẩu không chính xác")
    }
    const payload = { sub: user.id.toString() };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(32).toString("hex");
    const crsfToken = randomBytes(32).toString("hex");
    
    await this.cacheManager.set('test', '123', 60000)

    const refreshTokenCacheData: { userId: bigint; expiresAt: number } = {
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    }; // chưa hiểu 

    await this.cacheManager.set(`refresh_token:${refreshToken}`, refreshTokenCacheData, 30 * 24 * 60 * 60 ); // chưa hiểu 

    return this.authResponse(accessToken, crsfToken);
  }

  authResponse (accessToken: string, crsfToken: string): ILoginResponse {
    const decoded = this.jwtService.decode<IJwtPayload>(accessToken); 
    // decoded() đọc data của header và payload trong accesstoken
    if(!decoded || !('exp' in decoded) || typeof decoded.exp !== 'number') {
      throw new Error()
    }
    const expiresAt = decoded.exp - Math.floor(Date.now() / 1000); // trả về còn bn phút
    // trong decoded payload có expiresAt là hết hạn vào lúc nào
    // Math.floor làm tròn xuống số nguyên gần nhất
    // đổi data.now() từ mili giây sang giây bằng cách chia cho 1000 
    return {
      accessToken: accessToken, 
      expiresAt: expiresAt,
      tokenType: 'Bearer',
      crsfToken: crsfToken
    }
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

// JWT có 3 phần:
// header.payload.signature
// header = JSON encode (base64url) chứa { alg: "HS256", typ: "JWT" }.
// payload = JSON encode (base64url) chứa { sub: userId }.
// signature = HMAC-SHA256( header + "." + payload, secretKey ).
// Data trước khi ký =
// base64url(header) + "." + base64url(payload)
// SecretKey: do bạn định nghĩa, chỉ server biết.
// HMAC sẽ trộn secretKey vào data rồi hash → ra signature.
// Signature: là chuỗi hex (hoặc base64url) cố định độ dài (SHA-256 = 256 bit = 64 hex).
// Output thay đổi hoàn toàn nếu payload thay đổi dù chỉ 1 ký tự.
// AccessToken (JWT) =
// base64url(header) + "." + base64url(payload) + "." + signature
// Base64 vs Base64Url:
// Base64: dùng + và /.
// Base64Url: thay + → -, / → _ (để token an toàn khi truyền qua URL).