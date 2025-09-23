import { Inject, Injectable, InternalServerErrorException, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthRequest } from './auth.request.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from '../user/user.interface';
import { ILoginResponse, IJwtPayload, ITokenContext, ISessionData } from './auth.interface';
import { JwtService } from '@nestjs/jwt'; // header + payload + signature 
import { randomBytes } from 'crypto'; 
// randomBytes tạo ra 1 chuỗi byte ngẫu nhiên với độ dài định nghĩa 
// thường dùng tạo secret key, token
// crypto cung cấp các hàm liên quan đến mã hóa, băm, hash 
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Request } from 'express';

const REFRESH_TOKEN_TIME_TO_LIVE = 30 * 24 * 60 * 60 
const MAX_SESSION_PER_USER = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private readonly prismaService: PrismaService,
              private readonly jwtService: JwtService,
              @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async authenticate(authRequest: AuthRequest, request: Request): Promise<ILoginResponse> {
    try {
      // tạo context request 
      // validate dữ liệu context
      // xóa session cũ
      // tạo accesstoken, refreshtoken, crsftoken
      // khởi tạo lại phiên đăng nhập và trả về kết quả
      return await this.createAuthContext(authRequest, request) // mới đầu user sẽ là null vì chưa validate và chưa nhận đăng nhập 
                   .then(context => this.validateUser(context)) 
                   .then(context => this.revokeExistingDeviceSession(context)) // thu hồi lại phiên cũ 
                   .then(context => this.generateAccessToken(context))
                   .then(context => this.generateRefreshToken(context))
                   .then(context => this.generateCrsfToken(context))
                   .then(context => this.saveSession(context))
                   .then(context => this.authResponse(context))

    } catch (error) {
      if(error instanceof Error) {
        this.logger.error(`Lỗi trong quá trình xác thực: ${error.message}`, error.stack);
      }
      if(error instanceof UnauthorizedException) {
        throw error 
      }
      throw new InternalServerErrorException('Có vấn đề xảy ra trong quá trình xác thực');
    }
  }

  private async createAuthContext(authRequest: AuthRequest, request: Request): Promise<ITokenContext> {
    return Promise.resolve({
      authRequest, 
      user: null,
      deviceId: this.generateDeviceId(request)
    })
  }
  
  private generateDeviceId(request: Request): string {
    const userAgent = request.headers['user-agent'] || 'unknown'
    const ip = request.ip || 'unknown'
    return Buffer.from(`${userAgent}:${ip}`).toString('base64');
    // buffer đổi sang binary data
    // rồi sang base64 chỉ dùng đúng các ký tự ASCII: base64 chỉ dùng đúng các ký tự ASCII
    // để đản bảo dữ liệu gửi đi an toàn 
  }

  private async revokeExistingDeviceSession(context: ITokenContext): Promise<ITokenContext> {
    const { user, deviceId } = context;
    if (!user || !deviceId) return context;
    try {
      const userSessions: string[] = await this.cacheManager.get(`user:${user.id}:sessions`) || []; 
      // user:15:sessions = ['A', 'B']
      let updateSession = [...userSessions];
      for (let i = 0; i < userSessions.length; i++) {
        const sessionId = userSessions[i]; 
        const session = await this.cacheManager.get(`session:${sessionId}`) as ISessionData | null; // get in ra data của session:$sessionid 
        // session:A = { deviceId: 'abc', isRevoked: false, ... }
        // session:B = { deviceId: 'xyz', isRevoked: false, ... } 
        // session:C = { deviceId: 'abc', isRevoked: false, ... }
        if (session && session.deviceId === deviceId) {
          session.isRevoked = true; // ghi đè lại vào redis 
          await this.cacheManager.set(`session:${sessionId}`, session);
          updateSession = updateSession.filter(id => id !== sessionId); // dữ lại cái khác nhau thôi 
          this.logger.log(`Đã vô hiệu hóa phiên ${sessionId} trên thiết bị ${deviceId}`);
        }
      }
      if (updateSession.length !== userSessions.length) {
        await this.cacheManager.set(`user:${user.id}:sessions`, updateSession);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Lỗi trong quá trình xác thực: ${error.message}`, error.stack);
      }
    }
    return context;
  }
  
  private async generateAccessToken(context: ITokenContext): Promise<ITokenContext> {
    if (!context.user) throw new Error("Không có thông tin User trong Context");
    const payload = { sub: context.user.id.toString() };
    context.accessToken = await this.jwtService.signAsync(payload);
    return context;
  }

  private async generateRefreshToken(context: ITokenContext): Promise<ITokenContext> {
    context.refreshToken = randomBytes(32).toString('hex');
    return Promise.resolve(context);
  }

  private async generateCrsfToken(context: ITokenContext): Promise<ITokenContext> {
    context.crsfToken = randomBytes(32).toString('hex');
    return Promise.resolve(context);
  }
  
  private async saveSession(context: ITokenContext): Promise<ITokenContext> {
    const { user, deviceId, refreshToken, crsfToken } = context; // lấy những thứ quan trọng đã được tạo trước đó 
    if (!user || !deviceId || !refreshToken || !crsfToken) {
      throw new Error("Thiếu thông tin trong context để khởi tạo phiên đăng nhập");
    }
  
    const sessionId = randomBytes(16).toString("hex");
    const sessionData: ISessionData = {
      userId: user.id.toString(),
      deviceId,
      refreshToken,
      crsfToken,
      createdAt: Date.now(), // timestamp khi session được tạo (mốc ban đầu)
      lastUsed: Date.now(), // lần cuối cùng user sử dụng refresh token này
      wasUsed: false, // Khi true nghĩa là refresh token này đã được dùng để xin access token mới.
      isRevoked: false, // ếu = true nghĩa là session này đã bị hủy (vd: user logout) 
      expiresAt: Date.now() + REFRESH_TOKEN_TIME_TO_LIVE * 1000,  // thời điểm session hết hạn (theo TTL refresh token).
    };
  
    const userSessions: string[] = (
      (await this.cacheManager.get(`user:${user.id}:sessions`)) ?? []
    );
  
    if (userSessions.length >= MAX_SESSION_PER_USER) {
      await this.removeOldestSession(user.id, userSessions);
    }
    
    await Promise.all([
      this.cacheManager.set(`session:${sessionId}`, sessionData, REFRESH_TOKEN_TIME_TO_LIVE), // toàn bộ thông tin về phiên đăng nhập 
      this.cacheManager.set(`refresh_token:${refreshToken}`, sessionId, REFRESH_TOKEN_TIME_TO_LIVE),
      // user gửi refreshToken lên thì server tra ngược để biết nó thuộc session nào 
      this.cacheManager.set(`user:${user.id}:sessions`, [...userSessions, sessionId])
      // list sessionid của user
    ]);
    context.sessionId = sessionId 
    return context
  }

  private async removeOldestSession(userId: bigint, sessions: string[]): Promise<void> {
    let oldestSessionId: string | null = null;
    let oldestTimestamp = Infinity;
  
    for (const sessionId of sessions) {
      const session = await this.cacheManager.get(`session:${sessionId}`) as ISessionData | null;
      if (session && session.createdAt < oldestTimestamp) {
        oldestTimestamp = session.createdAt;
        oldestSessionId = sessionId; // ghi lại cái session cũ nhất 
      }
      // ví dụ 3 session: Session A: createdAt = 1000/ Session B: createdAt = 500/ Session C: createdAt = 2000
      // Gặp A (1000 < Infinity) → cập nhật: oldestTimestamp = 1000, oldestSessionId = A
      // Gặp B (500 < 1000) → cập nhật: oldestTimestamp = 500, oldestSessionId = B
      // Gặp C (2000 < 500 ? ❌ không) → bỏ qua
    }
  
    if (oldestSessionId) {
      const oldestSession = await this.cacheManager.get(`session:${oldestSessionId}`) as ISessionData | null;
      if (oldestSession) {
        oldestSession.isRevoked = true;
        await this.cacheManager.set(`session:${oldestSessionId}`, oldestSession);
        await this.cacheManager.set(
          `user:${userId}:sessions`,
          sessions.filter(id => id != oldestSessionId)
        );
      } else {
        this.logger.warn(`Không tìm thấy dữ liệu phiên cho sessionID ${oldestSessionId}`);
      }
    }
  }

  private safeStringify(obj: any) {
    return JSON.stringify(obj, (_key, value) => typeof value === 'bigint' ? value.toString() : value);
  }

  private async authResponse(context: ITokenContext): Promise<ILoginResponse> {
    this.logger.log(`authResponse context: ${this.safeStringify(context)}`);
    const { accessToken, refreshToken, crsfToken } = context;
    if (!accessToken || !refreshToken || !crsfToken) {
      this.logger.error(`Missing token data in context: accessToken=${!!accessToken}, refreshToken=${!!refreshToken}, crsfToken=${!!crsfToken}`);
      throw new Error('Thiếu thông tin AccessToken, RefreshToken hoặc CrsfToken trong Context');
    }
    const decoded = this.jwtService.decode<IJwtPayload>(accessToken);
    const expiresAt = decoded.exp - Math.floor(Date.now() / 1000);
    return Promise.resolve({
      accessToken,
      refreshToken,
      crsfToken,
      expiresAt,
      tokenType: 'Bearer',
    });
  }
  
  async validateUser(context: ITokenContext): Promise<ITokenContext> {
    const {email, password} = context.authRequest; 
    const user = await this.prismaService.user.findUnique({
      where: { email } // email user nhập, input đầu vào 
    })
    if( !user || !(await bcrypt.compare(password, user.password)) ) {
      throw new UnauthorizedException("Email hoặc mật khẩu không chính xác")
    }
    const {password: _, ...userWithoutPassword} = user
    context.user = userWithoutPassword
    return context;
    // password: _ là cú pháp object destructing
    // ...result rest operator 
    // bỏ key password trong object user, các key còn lại gom vào result 
  }

  // Đăng ký user mới
  async register(authRequest: AuthRequest): Promise<void> {
    const { email, password, name } = authRequest;
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.prismaService.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      throw new UnauthorizedException("Email đã được sử dụng");
    }
    // Hash password và tạo user mới
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);
    await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0] // Nếu không có name thì dùng phần trước @ của email
      }
    });
  }

  // Refresh token
  async refreshToken(refreshToken: string, request: Request): Promise<ILoginResponse> {
    try {
      this.logger.log(`Attempting refresh for token: ${refreshToken}`);
      // Tìm session từ refresh token
      const sessionId = await this.cacheManager.get(`refresh_token:${refreshToken}`) as string;
      this.logger.log(`Lookup refresh_token:${refreshToken} => sessionId=${sessionId}`);
      if (!sessionId) {
        this.logger.warn(`No sessionId for refresh token: ${refreshToken}`);
        throw new UnauthorizedException("Refresh token không hợp lệ");
      }
      // Lấy thông tin session
      const session = await this.cacheManager.get(`session:${sessionId}`) as ISessionData;
      this.logger.log(`Found session for ${sessionId}: ${JSON.stringify(session)}`);
      if (!session || session.isRevoked || session.expiresAt < Date.now()) {
        this.logger.warn(`Session invalid for ${sessionId}: isRevoked=${session?.isRevoked}, expiresAt=${session?.expiresAt}, now=${Date.now()}`);
        throw new UnauthorizedException("Session đã hết hạn hoặc bị hủy");
      }
      // Lấy thông tin user
      const user = await this.prismaService.user.findUnique({
        where: { id: BigInt(session.userId) }
      });
      this.logger.log(`User lookup for id=${session.userId} => ${user ? 'FOUND' : 'NOT_FOUND'}`);
      if (!user) {
        throw new UnauthorizedException("User không tồn tại");
      }
      const { password: _, ...userWithoutPassword } = user;
      // Tạo context mới
      const context: ITokenContext = {
        user: userWithoutPassword,
        deviceId: session.deviceId,
        authRequest: { email: user.email, password: '' } // Không cần password cho refresh
      };
      // Sử dụng refreshToken hiện có từ session để trả về (không tạo refresh mới tại bước refresh)
      context.refreshToken = session.refreshToken;
      context.sessionId = sessionId;
      // Tạo access token mới
      await this.generateAccessToken(context);
      await this.generateCrsfToken(context);
      this.logger.log(`Generated tokens in context: accessToken=${!!context.accessToken}, crsfToken=${!!context.crsfToken}`);
      // Cập nhật session
      session.lastUsed = Date.now();
      session.wasUsed = true;
      await this.cacheManager.set(`session:${sessionId}`, session);
      this.logger.log(`Session updated lastUsed/wasUsed for ${sessionId}`);
      return this.authResponse(context);
    } catch (error) {
      this.logger.error(`Lỗi refresh token: ${error.message}`, error.stack);
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }
  }


  // Logout
  async logout(refreshToken: string, request: Request): Promise<void> {
    try {
      // Tìm session từ refresh token
      const sessionId = await this.cacheManager.get(`refresh_token:${refreshToken}`) as string;
      if (!sessionId) {
        this.logger.warn("Refresh token không tồn tại trong logout");
        return;
      }
      // Lấy thông tin session
      const session = await this.cacheManager.get(`session:${sessionId}`) as ISessionData;
      if (session) {
        // Hủy session
        session.isRevoked = true;
        await this.cacheManager.set(`session:${sessionId}`, session);
        // Xóa khỏi danh sách session của user
        const userSessions: string[] = await this.cacheManager.get(`user:${session.userId}:sessions`) || [];
        const updatedSessions = userSessions.filter(id => id !== sessionId);
        // filter tạo ra mảng mới loại bỏ phần tử bằng sessionId hiện tại.
        await this.cacheManager.set(`user:${session.userId}:sessions`, updatedSessions);
        this.logger.log(`User ${session.userId} đã đăng xuất session ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(`Lỗi logout: ${error.message}`, error.stack);
      throw error;
    }
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










