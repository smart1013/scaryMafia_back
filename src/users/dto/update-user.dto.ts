import { IsOptional, IsString, IsEmail, Length, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  userEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @IsNotEmpty()
  nickname?: string;

  @IsOptional()
  @IsString()
  img_url?: string;
}