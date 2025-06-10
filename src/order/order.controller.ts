import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage, User } from '../decorator/customize';
import { IUser } from '../users/user.interface';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Create order")
  create(@Body() createOrderDto: CreateOrderDto, @User() user: IUser) {
    return this.orderService.create(createOrderDto, user);
  }

  @Get()
  @ResponseMessage("Fetch orders")
  findAll(
    @Query("current") current: string,
    @Query("pageSize") pageSize: string,
    @Query() qs: string,
  ) {
    if (current && pageSize) {
      return this.orderService.findAllWithPaginate(+current, +pageSize, qs);
    }
    return this.orderService.findAll();
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage("Fetch user's orders")
  getUserOrders(@User() user: IUser) {
    return this.orderService.findByUserId(user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage("Update order status")
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
