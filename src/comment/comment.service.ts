import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './schemas/comment.schema';
import { CommentGateway } from './comment.gateway';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private readonly commentGateway: CommentGateway,
  ) { }

  async create(createCommentDto: CreateCommentDto) {
    const created = await this.commentModel.create(createCommentDto);
    const populated = await created.populate('user_id', 'fullName avatar');
    this.commentGateway.emitNewComment(populated);
    return populated;
  }

  async findAll() {
    return this.commentModel.find().populate('user_id', 'fullName avatar').exec();
  }

  async findByBook(bookId: string) {
    return this.commentModel.find({ book_id: bookId }).populate('user_id', 'fullName avatar').sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    return this.commentModel.findById(id).populate('user_id', 'fullName avatar').exec();
  }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    return this.commentModel.findByIdAndUpdate(id, updateCommentDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.commentModel.findByIdAndDelete(id).exec();
  }

  async paginateComments(current: number = 1, pageSize: number = 5) {
    const total = await this.commentModel.countDocuments();
    const pages = Math.ceil(total / pageSize);

    const result = await this.commentModel
      .find()
      .populate('user_id', 'fullName email avatar')
      .populate('book_id', 'mainText')
      .sort({ createdAt: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean();

    // Đổi tên trường cho frontend khớp (user, book)
    const mapped = result.map((c: any) => ({
      ...c,
      user: c.user_id,
      book: c.book_id,
    }));

    return {
      meta: {
        current,
        pageSize,
        pages,
        total,
      },
      result: mapped,
    };
  }
}
