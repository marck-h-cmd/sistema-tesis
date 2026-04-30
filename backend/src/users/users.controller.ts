import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolNombre } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async findAll() {
    const users = await this.usersService.findAll();
    return { data: users };
  }

  @Get(':id')
  @Roles(RolNombre.admin, RolNombre.coordinador)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    return { data: user };
  }

  @Post()
  @Roles(RolNombre.admin)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return { data: user, message: 'Usuario creado exitosamente' };
  }

  @Put(':id')
  @Roles(RolNombre.admin)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(+id, updateUserDto);
    return { data: user, message: 'Usuario actualizado exitosamente' };
  }

  @Delete(':id')
  @Roles(RolNombre.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(+id);
  }

  @Post(':id/roles/:roleName')
  @Roles(RolNombre.admin)
  async assignRole(
    @Param('id') id: string,
    @Param('roleName') roleName: string,
  ) {
    const user = await this.usersService.assignRole(+id, roleName);
    return { data: user, message: `Rol ${roleName} asignado exitosamente` };
  }

  @Delete(':id/roles/:roleName')
  @Roles(RolNombre.admin)
  async removeRole(
    @Param('id') id: string,
    @Param('roleName') roleName: string,
  ) {
    const user = await this.usersService.removeRole(+id, roleName);
    return { data: user, message: `Rol ${roleName} removido exitosamente` };
  }
}