import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @Expose()
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @Expose()
  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @Expose()
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @Expose()
  @ApiProperty({
    description: 'User active status',
    example: true,
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'User last update date',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
