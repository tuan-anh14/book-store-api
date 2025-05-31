import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SupportRequestService } from './support-request.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';

@Controller('support-request')
export class SupportRequestController {
  constructor(private readonly supportRequestService: SupportRequestService) {}

  @Post()
  create(@Body() createSupportRequestDto: CreateSupportRequestDto) {
    return this.supportRequestService.create(createSupportRequestDto);
  }

  @Get()
  findAll() {
    return this.supportRequestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supportRequestService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupportRequestDto: UpdateSupportRequestDto) {
    return this.supportRequestService.update(+id, updateSupportRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportRequestService.remove(+id);
  }
}
