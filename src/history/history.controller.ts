import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage, User } from '../decorator/customize';
import { IUser } from '../users/user.interface';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ResponseMessage("Fetch user purchase history")
  findAll(
    @User() user: IUser,
    @Query("current") current: string,
    @Query("pageSize") pageSize: string,
    @Query() qs: string,
  ) {
    // Nếu có tham số phân trang, sử dụng phân trang
    if (current && pageSize) {
      // Thêm userId vào query string để lọc theo người dùng hiện tại
      qs += `&userId=${user._id}`;
      return this.historyService.findAllWithPaginate(+current, +pageSize, qs);
    }

    // Nếu không có tham số phân trang, lấy tất cả lịch sử của người dùng hiện tại
    return this.historyService.findByUserId(user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyService.findOne(id);
  }
}
