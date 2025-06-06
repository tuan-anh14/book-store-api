import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from './user.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Post()
  @ResponseMessage("Create a new User")
  async create(@Body() CreateUserDto: CreateUserDto, @User() user: IUser) {
    let newUser = await this.usersService.create(user);
    return {
      _id: newUser?._id,
      createdAt: newUser?.createdAt
    };
  }

  @Get()
  @ResponseMessage("Fetch users")
  findAll(
    @Query("current") current: string,
    @Query("pageSize") pageSize: string,
    @Query() qs: string,
  ) {
    // Kiểm tra nếu có tham số phân trang (current và pageSize) thì gọi phương thức phân trang
    if (current && pageSize) {
      return this.usersService.findAllPaginate(+current, +pageSize, qs);
    }
    // Nếu không có tham số phân trang, gọi phương thức lấy tất cả
    return this.usersService.findAll();
  }

  @Public()
  @Get(':id')
  @ResponseMessage("Fetch user by id")
  async findOne(@Param('id') id: string) {
    const foundUser = await this.usersService.findOne(id);
    return foundUser;
  }

  @ResponseMessage("Update a User")
  @Put()
  async update(@Body() updateUserDto: UpdateUserDto, @User() user: IUser) {
    let updatedUser = await this.usersService.update(updateUserDto, user);
    return updatedUser;
  }

  @Delete(':id')
  @ResponseMessage("Delete a User")
  async remove(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.remove(id, user);
  }

  @Post('/bulk-create')
  @ResponseMessage('Bulk create users')
  async bulkCreate(@Body() users: CreateUserDto[], @User() user: IUser) {
    return this.usersService.bulkCreate(users, user);
  }

  @Post('/change-password')
  @ResponseMessage("Change password successfully")
  changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(changePasswordDto);
  }

  @ResponseMessage("Update user info")
  @Put('/info')
  async updateUserInfo(@Body() updateUserInfoDto: UpdateUserInfoDto) {
    return this.usersService.updateUserInfo(updateUserInfoDto);
  }

}
