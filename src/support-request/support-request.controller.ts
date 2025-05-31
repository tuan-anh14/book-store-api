import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SupportRequestService } from './support-request.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import { ResponseMessage } from 'src/decorator/customize';

@Controller('support-request')
export class SupportRequestController {
  constructor(private readonly supportRequestService: SupportRequestService) { }


  @ResponseMessage("Create a new Support Request")
  @Post()
  create(@Body() createSupportRequestDto: CreateSupportRequestDto) {
    return this.supportRequestService.create(createSupportRequestDto);
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.supportRequestService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportRequestService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupportRequestDto: UpdateSupportRequestDto) {
    return this.supportRequestService.update(id, updateSupportRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportRequestService.remove(id);
  }
}
