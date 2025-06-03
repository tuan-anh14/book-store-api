import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('revenue/realtime')
  async getRealTimeRevenue() {
    return this.analyticsService.getRealTimeRevenue();
  }

  @Get('products/top-selling')
  async getTopSellingProducts(
    @Query('timeframe') timeframe: 'hour' | 'day' | 'week' | 'month' | 'all' = 'day',
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getTopSellingProducts(
      timeframe,
      year,
      month,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('sales/performance')
  async getSalesPerformance(
    @Query('year') year?: number,
    @Query('month') month?: number
  ) {
    return this.analyticsService.getSalesPerformance(year, month);
  }

  @Get('revenue/trends')
  async getRevenueTrends(
    @Query('period') period: 'day' | 'week' | 'month' = 'day'
  ) {
    return this.analyticsService.getRevenueTrends(period);
  }
}
