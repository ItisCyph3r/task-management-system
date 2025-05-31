import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, response: Response): Promise<{ user: UserResponseDto }> {
    const { email, password } = loginDto;
    
    // Find user by email & Validate password
    const user = await this.userService.findByEmail(email);
    
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }
    
    // Generate token
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '7d', // Default to 7 days
    });
    
    // Set cookie
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    response.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      path: '/',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    
    return {
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }

  async logout(response: Response) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    try {
      response.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: isProduction,
        path: '/',
      });
    } catch (error) {
      response.json({ message: 'Error clearing cookie:', error });
    }
    
    return { message: 'Logout successful' };
  }

  async register(registerDto: RegisterDto, response: Response): Promise<{ user: UserResponseDto }> {
    // Convert RegisterDto to CreateUserDto
    const createUserDto: CreateUserDto = {
      ...registerDto,
      role: registerDto.role || UserRole.USER, // role is optional so it defaults to USER role
    };

    // Create user
    const user = await this.userService.create(createUserDto);

    // Generate token
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '7d', // Default to 7 days
    });
    
    // Set cookie
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    response.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      path: '/', 
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });
    
    return {
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }


}
