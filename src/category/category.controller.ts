import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/user.interface';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Public()
  @Get()
  @ResponseMessage('Get all categories')
  findAll() {
    return this.categoryService.findAll();
  }

  @Post()
  @ResponseMessage('Create a new category')
  create(@Body() createCategoryDto: CreateCategoryDto, @User() user: IUser) {
    return this.categoryService.create(createCategoryDto, user);
  }

  @Patch()
  @ResponseMessage('Update a category')
  update(@Body() updateCategoryDto: UpdateCategoryDto, @User() user: IUser) {
    return this.categoryService.update(updateCategoryDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete a category')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.categoryService.remove(id, user);
  }
}
