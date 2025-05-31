import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../user/entities/user.entity';
import { LoginDto } from '../dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens and user data when login is successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        isActive: true,
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValueOnce('token');
      mockConfigService.get.mockImplementation((key) => {
        const config = {
          JWT_SECRET: 'test_secret',
          JWT_EXPIRATION: '1h',
          JWT_REFRESH_SECRET: 'test_refresh_secret',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key];
      });

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: expect.any(Object),
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong_password',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        isActive: false,
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await service.logout('1');
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });

  describe('validateToken', () => {
    it('should return decoded token if valid', async () => {
      const mockDecodedToken = {
        sub: '1',
        email: 'test@example.com',
        role: UserRole.USER,
      };

      mockJwtService.verify.mockReturnValue(mockDecodedToken);
      mockConfigService.get.mockReturnValue('test_secret');

      const result = await service.validateToken('valid_token');

      expect(result).toEqual(mockDecodedToken);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid_token', {
        secret: 'test_secret',
      });
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockConfigService.get.mockReturnValue('test_secret');

      await expect(service.validateToken('invalid_token')).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.verify).toHaveBeenCalledWith('invalid_token', {
        secret: 'test_secret',
      });
    });
  });
});
