import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Password must contain at least 8 characters, one uppercase letter, and one symbol',
  })
  password!: string;
}
