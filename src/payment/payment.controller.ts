import { Controller, Get, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public } from 'src/decorator/customize';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Public()
    @Get('create_payment')
    async createPayment(@Query('amount') amount: number) {
        return this.paymentService.createPayment(amount);
    }

    @Public()
    @Get('check_payment')
    async checkPayment(@Query() query: any) {
        return this.paymentService.checkPayment(query);
    }
} 