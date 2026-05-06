import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@clinicallab.test' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password1',
    description: 'At least 8 characters with at least one letter and one number',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'Password must be at least 8 characters and include at least one letter and one number',
  })
  password: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Student' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+10000000004', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
