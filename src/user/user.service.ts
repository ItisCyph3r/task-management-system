import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(page: number = 1, limit: number = 10): Promise<[UserResponseDto[], number]> {
    const [users, count] = await this.userRepository.findAllWithPagination(page, limit);
    const userResponses = users.map(user => plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }));
    return [userResponses, count];
  }

  async findOne(id: string): Promise<User> {
    try {
      this.logger.debug(`Looking for user with ID: ${id}`);
      const user = await this.userRepository.findOne(id);
      
      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      this.logger.debug(`User found: ${id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user with ID ${id}: ${error.message}`);
      
      // Re-throw the original error if it's a NotFoundException
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // For other errors, throw a more generic error
      throw new NotFoundException(`Error finding user with ID ${id}`);
    }
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user with the same email already exists
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }

    const user = await this.userRepository.create(createUserDto);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  async getUserProfile(id: string): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
