import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('revenue/realtime')
  async getRealTimeRevenue() {
    return this.analyticsService.getRealTimeRevenue();
  }

  @Get('revenue/historical')
  async getHistoricalRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'hour' | 'day' | 'month' = 'day'
  ) {
    return this.analyticsService.getHistoricalRevenue(
      new Date(startDate),
      new Date(endDate),
      groupBy
    );
  }

  @Get('products/top-selling')
  async getTopSellingProducts(
    @Query('timeframe') timeframe: 'hour' | 'day' | 'week' = 'day'
  ) {
    return this.analyticsService.getTopSellingProducts(timeframe);
  }

  @Get('sales/performance')
  async getSalesPerformance() {
    return this.analyticsService.getSalesPerformance();
  }

  @Get('revenue/trends')
  async getRevenueTrends(
    @Query('period') period: 'day' | 'week' | 'month' = 'day'
  ) {
    return this.analyticsService.getRevenueTrends(period);
  }

  @Get('products/performance')
  async getProductPerformance() {
    return this.analyticsService.getProductPerformance();
  }
}
