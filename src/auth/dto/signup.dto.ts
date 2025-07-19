import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MaxLength(10)
  @IsNotEmpty()
  nickname: string;
}