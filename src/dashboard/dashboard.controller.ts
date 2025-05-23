import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Public, ResponseMessage } from 'src/decorator/customize';

@Controller('/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @ResponseMessage("Get dashboard statistics")
    getDashboardStats() {
        return this.dashboardService.getDashboardStats();
    }

    @Get('revenue')
    @ResponseMessage("Get total revenue")
    getTotalRevenue() {
        return this.dashboardService.getTotalRevenue();
    }

    @Get('sales')
    @ResponseMessage("Get overall sales by payment type")
    getOverallSales() {
        return this.dashboardService.getOverallSales();
    }

    @Get('orders/status')
    @ResponseMessage("Get orders by status")
    getOrdersByStatus() {
        return this.dashboardService.getOrdersByStatus();
    }

    @Get('reviews')
    @ResponseMessage("Get customer reviews statistics")
    getCustomerReviews() {
        return this.dashboardService.getCustomerReviews();
    }

    @Get('monthly-revenue')
    @ResponseMessage("Get monthly revenue for 2024")
    getMonthlyRevenue() {
        return this.dashboardService.getMonthlyRevenue();
    }
} 