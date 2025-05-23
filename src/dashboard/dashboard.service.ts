import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { Comment, CommentDocument } from '../comment/schemas/comment.schema';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
        @InjectModel(Order.name)
        private orderModel: Model<OrderDocument>,
        @InjectModel(Book.name)
        private bookModel: Model<BookDocument>,
        @InjectModel(Comment.name)
        private commentModel: Model<CommentDocument>,
    ) { }

    async getDashboardStats() {
        const [countUser, countOrder, countBook] = await Promise.all([
            this.userModel.countDocuments(),
            this.orderModel.countDocuments(),
            this.bookModel.countDocuments(),
        ]);

        return {
            countUser,
            countOrder,
            countBook,
        };
    }

    // Tính tổng doanh thu từ tất cả đơn hàng
    async getTotalRevenue() {
        const result = await this.orderModel.aggregate([
            {
                $match: {
                    status: { $ne: 'CANCELLED' } // Loại bỏ các đơn hàng đã hủy
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);

        return {
            totalRevenue: result[0]?.totalRevenue || 0
        };
    }

    // Thống kê doanh thu theo phương thức thanh toán
    async getOverallSales() {
        const result = await this.orderModel.aggregate([
            {
                $match: {
                    status: { $ne: 'CANCELLED' }
                }
            },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            }
        ]);

        return result.map(item => ({
            type: item._id,
            totalAmount: item.totalAmount,
            count: item.count
        }));
    }

    // Thống kê số lượng đơn hàng theo trạng thái
    async getOrdersByStatus() {
        const result = await this.orderModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return result.map(item => ({
            status: item._id,
            count: item.count
        }));
    }

    // Thống kê đánh giá của khách hàng
    async getCustomerReviews() {
        const result = await this.commentModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$star' },
                    ratingDistribution: {
                        $push: {
                            bookId: '$book_id',
                            rating: '$star'
                        }
                    }
                }
            }
        ]);

        // Tính số lượng đánh giá theo từng mức sao
        const ratingCounts = await this.commentModel.aggregate([
            {
                $group: {
                    _id: '$star',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return {
            totalReviews: result[0]?.totalReviews || 0,
            averageRating: result[0]?.averageRating || 0,
            ratingDistribution: ratingCounts.map(item => ({
                rating: item._id,
                count: item.count
            }))
        };
    }

    async getMonthlyRevenue() {
        const result = await this.orderModel.aggregate([
            {
                $match: {
                    status: { $ne: 'CANCELLED' },
                    createdAt: {
                        $gte: new Date('2025-01-01'),
                        $lt: new Date('2026-01-01')
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' }
                    },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            },
            {
                $sort: { '_id.month': 1 }
            }
        ]);

        // Chuyển đổi kết quả thành định dạng mong muốn
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedResult = months.map((month, index) => {
            const monthData = result.find(item => item._id.month === index + 1);
            return {
                month,
                revenue: monthData ? monthData.totalRevenue : 0
            };
        });

        return formattedResult;
    }

} 