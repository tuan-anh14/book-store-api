import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { PipelineStage } from 'mongoose';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) { }

  // Helper function to get start of week
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  // Helper function to get start of month
  private getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  // Helper function to get end of month
  private getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  // Helper function to get date range for specific month
  private getMonthRange(year: number, month: number): { startDate: Date; endDate: Date } {
    const startDate = new Date(year, month - 1, 1); // month is 0-based in JS
    const endDate = new Date(year, month, 0); // last day of the month
    return { startDate, endDate };
  }

  // Helper function to check if date is in the future
  private isFutureDate(date: Date): boolean {
    return date > new Date();
  }

  // Helper function to check if date range is valid
  private isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate && !this.isFutureDate(startDate);
  }

  // 1. Real-time Revenue Analytics (Last 1 hour)
  async getRealTimeRevenue() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: { $gte: oneHourAgo },
          status: { $ne: 'CANCELLED' }
        }
      },
      {
        $addFields: {
          vietnamTime: {
            $add: [
              '$createdAt',
              7 * 60 * 60 * 1000 // Add 7 hours for Vietnam timezone
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$vietnamTime' },
            minute: { $minute: '$vietnamTime' }
          },
          revenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.hour': 1, '_id.minute': 1 }
      }
    ];

    return this.orderModel.aggregate(pipeline);
  }

  // 2. Top Selling Products Analytics
  async getTopSellingProducts(
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'all' = 'day',
    year?: number,
    month?: number,
    startDate?: Date,
    endDate?: Date
  ) {
    let queryStartDate: Date;
    let queryEndDate: Date = new Date();

    if (startDate && endDate) {
      queryStartDate = startDate;
      queryEndDate = endDate;
    } else if (year && month) {
      const range = this.getMonthRange(year, month);
      queryStartDate = range.startDate;
      queryEndDate = range.endDate;
    } else {
      const now = new Date();
      switch (timeframe) {
        case 'hour':
          // Lấy 1 giờ gần nhất
          queryStartDate = new Date(now.getTime() - 60 * 60 * 1000);
          queryEndDate = now;
          break;
        case 'day':
          // Lấy từ 00:00 đến 23:59 của ngày hiện tại
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          queryEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          // Lấy từ thứ 2 đến chủ nhật của tuần hiện tại
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), diff);
          queryEndDate = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
          break;
        case 'month':
          // Lấy từ ngày 1 đến ngày cuối của tháng hiện tại
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          queryEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'all':
          // Lấy cả năm 2025
          queryStartDate = new Date(2025, 0, 1);
          queryEndDate = new Date(2025, 11, 31, 23, 59, 59);
          break;
        default:
          queryStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    // Đơn giản hóa pipeline
    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: {
            $gte: queryStartDate,
            $lte: queryEndDate
          },
          status: { $ne: 'CANCELLED' }
        }
      },
      {
        $unwind: '$detail'
      },
      {
        $group: {
          _id: '$detail._id',
          bookName: { $first: '$detail.bookName' },
          totalQuantity: { $sum: '$detail.quantity' },
          totalRevenue: { $sum: '$totalPrice' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 50
      }
    ];

    const result = await this.orderModel.aggregate(pipeline);

    return result;
  }

  // 3. Sales Performance Analytics
  async getSalesPerformance(year?: number, month?: number) {
    let startOfDay: Date;
    let startOfWeek: Date;
    let startOfMonth: Date;
    let endDate: Date;

    if (year && month) {
      const range = this.getMonthRange(year, month);
      startOfMonth = range.startDate;
      endDate = range.endDate;
      startOfWeek = this.getStartOfWeek(range.startDate);
      startOfDay = range.startDate;

      // Kiểm tra nếu thời gian trong tương lai
      if (this.isFutureDate(startOfMonth)) {
        return {
          daily: [],
          weekly: [],
          monthly: []
        };
      }
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Nếu đang ở đầu tháng (ngày 1-7), lấy từ đầu tháng
      if (now.getDate() <= 7) {
        startOfWeek = startOfMonth;
      } else {
        startOfWeek = this.getStartOfWeek(now);
      }

      endDate = now;
    }

    // Kiểm tra khoảng thời gian hợp lệ
    if (!this.isValidDateRange(startOfMonth, endDate)) {
      return {
        daily: [],
        weekly: [],
        monthly: []
      };
    }

    const pipeline: PipelineStage[] = [
      {
        $facet: {
          daily: [
            {
              $match: {
                createdAt: {
                  $gte: startOfDay,
                  $lte: endDate
                },
                status: { $ne: 'CANCELLED' }
              }
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: '$totalPrice' },
                orderCount: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                revenue: 1,
                orderCount: 1
              }
            }
          ],
          weekly: [
            {
              $match: {
                createdAt: {
                  $gte: startOfWeek,
                  $lte: endDate
                },
                status: { $ne: 'CANCELLED' }
              }
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: '$totalPrice' },
                orderCount: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                revenue: 1,
                orderCount: 1
              }
            }
          ],
          monthly: [
            {
              $match: {
                createdAt: {
                  $gte: startOfMonth,
                  $lte: endDate
                },
                status: { $ne: 'CANCELLED' }
              }
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: '$totalPrice' },
                orderCount: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                revenue: 1,
                orderCount: 1
              }
            }
          ]
        }
      }
    ];

    return this.orderModel.aggregate(pipeline);
  }

  // 4. Revenue Trends Analysis
  async getRevenueTrends(period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let startDate: Date;
    let groupBy: any;

    switch (period) {
      case 'day':
        // Lấy doanh thu theo giờ trong ngày hiện tại
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        groupBy = {
          hour: { $hour: { $add: ['$createdAt', 7 * 60 * 60 * 1000] } }
        };
        break;
      case 'week':
        // Lấy doanh thu theo ngày trong tuần hiện tại
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        groupBy = {
          day: { $dayOfMonth: { $add: ['$createdAt', 7 * 60 * 60 * 1000] } }
        };
        break;
      case 'month':
        // Lấy doanh thu theo ngày trong tháng hiện tại
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          day: { $dayOfMonth: { $add: ['$createdAt', 7 * 60 * 60 * 1000] } }
        };
        break;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now
          },
          status: { $ne: 'CANCELLED' }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' }
        }
      },
      {
        $project: {
          _id: 0,
          time: '$_id',
          revenue: 1,
          orderCount: 1,
          averageOrderValue: 1
        }
      },
      {
        $sort: { 'time': 1 }
      }
    ];

    return this.orderModel.aggregate(pipeline);
  }
}
