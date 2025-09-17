// import { Strategy } from 'passport-local';
// import { PassportStrategy } from '@nestjs/passport';
// import { Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { UserWithoutPassword } from '../user/user.interface';
// import { ApiResponse } from 'src/common/bases/api.reponse';
// import { HttpStatus } from '@nestjs/common';

// @Injectable()
// export class LocalStrategy extends PassportStrategy(Strategy) {
//   constructor(private authService: AuthService) {
//     super({ 
//       usernameField: 'email',
//       passwordField: 'password',
//     });
//   }

//   async validate(email: string, password: string): Promise<UserWithoutPassword> {
//     const user = await this.authService.validateUser(email, password);
//     if (!user) {
//       const response = ApiResponse.message(
//         "Email hoặc mật khẩu không chính xác",
//         HttpStatus.UNAUTHORIZED
//       );
//       throw new HttpException(response, HttpStatus.UNAUTHORIZED);
//     //   throw new UnauthorizedException();
//     }
//     return user;
//   }

// }

