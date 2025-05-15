import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { IUser } from 'src/users/user.interface';
import { Public, ResponseMessage, User } from 'src/decorator/customize';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) { }

  @Post()
  create(@Body() createBookDto: CreateBookDto, @User() user: IUser) {
    return this.bookService.create(createBookDto);
  }

  @Public()
  @Get()
  @ResponseMessage("Fetch books")
  findAll(
    @Query("current") current: string,
    @Query("pageSize") pageSize: string,
    @Query() qs: string,
  ) {
    // Kiểm tra nếu có tham số phân trang (current và pageSize) thì gọi phương thức phân trang
    if (current && pageSize) {
      return this.bookService.findAllPaginate(+current, +pageSize, qs);
    }
    // Nếu không có tham số phân trang, gọi phương thức lấy tất cả
    return this.bookService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @User() user: IUser
  ) {
    return this.bookService.update(id, updateBookDto, user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @User() user: IUser
  ) {
    return this.bookService.remove(id, user);
  }
}
