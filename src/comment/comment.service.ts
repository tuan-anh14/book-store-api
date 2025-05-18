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
}
