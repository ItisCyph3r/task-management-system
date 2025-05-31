import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repositories/user.repository';
import { User, UserRole } from '../entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  const mockUserRepository = {
    findAllWithPagination: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users and count', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.USER,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      mockUserRepository.findAllWithPagination.mockResolvedValue([mockUsers, 1]);
      
      const result = await service.findAll();
      
      expect(result).toEqual([expect.any(Array), 1]);
      expect(mockUserRepository.findAllWithPagination).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.findOne('1');
      
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found by email', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      const result = await service.findByEmail('test@example.com');
      
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw NotFoundException if user not found by email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      await expect(service.findByEmail('test@example.com')).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        password: 'password123',
      };
      
      const mockUser = {
        id: '1',
        ...createUserDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      
      const result = await service.create(createUserDto);
      
      expect(result).toBeDefined();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        password: 'password123',
      };
      
      mockUserRepository.findByEmail.mockResolvedValue({ id: '1', email: createUserDto.email });
      
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.getUserProfile('1');
      
      expect(result).toBeDefined();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith('1');
    });
  });
});
