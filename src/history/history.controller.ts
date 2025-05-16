import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage, User } from '../decorator/customize';
import { IUser } from '../users/user.interface';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }

  @Post()
  create(@Body() createHistoryDto: CreateHistoryDto) {
    return this.historyService.create(createHistoryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Fetch history")
  findAll(@User() user: IUser) {
    return this.historyService.findAll(user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHistoryDto: UpdateHistoryDto) {
    return this.historyService.update(+id, updateHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyService.remove(+id);
  }
}
