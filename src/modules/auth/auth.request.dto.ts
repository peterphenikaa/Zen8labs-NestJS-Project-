import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional } from 'class-validator';

export class AuthRequest {
  @IsEmail({}, {message: "Email không đúng định dạng ví dụ: abc@gmail.com"})
  @IsNotEmpty({message: "Email không được để trống"})
  email: string;

  @IsString({message: "Mật khẩu phải là chuỗi kí tự"})
  @IsNotEmpty({message: "Mật khẩu không được để trống"})
  @MinLength(6, {message: "Mật khẩu phải có tối thiểu 6 kí tự"})
  password: string;

  @IsString({message: "Tên phải là chuỗi kí tự"})
  @IsOptional()
  name?: string;
}


