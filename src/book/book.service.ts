import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, BookDocument } from './schemas/book.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/user.interface';
import aqp from 'api-query-params';
import { isEmpty } from 'class-validator';
import { Model } from 'mongoose';

@Injectable()
export class BookService {

  constructor(
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>
  ) { }

  create(createBookDto: CreateBookDto) {
    return this.bookModel.create({ ...createBookDto });
  }

  async bulkCreate(createBookDtos: CreateBookDto[]) {
    const books = createBookDtos.map(book => ({
      ...book,
      quantity: 0,
      sold: 0,
      thumbnail: '',
      slider: []
    }));
    return this.bookModel.insertMany(books);
  }

  async findAll() {
    const result = await this.bookModel.find()
      .exec();

    return result;
  }

  async findAllPaginate(currentPage: number, limit: number, qs: string) {
    const { filter, projection, population, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.bookModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.bookModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage, //trang hiện tại 
        pageSize: limit, //số lượng bản ghi đã lấy 
        pages: totalPages,  //tổng số trang với điều kiện query 
        total: totalItems // tổng số phần tử (số bản ghi) 
      },
      result //kết quả query 
    }
  }

  findOne(id: string) {
    return this.bookModel.findOne({
      _id: id,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
  }

  async update(id: string, updateBookDto: UpdateBookDto, user: IUser) {
    const book = await this.bookModel.findOne({
      _id: id,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    if (!book) {
      throw new Error('Book not found');
    }

    return await this.bookModel.updateOne(
      { _id: id },
      {
        $set: {
          ...updateBookDto,
          updatedAt: new Date()
        }
      }
    );
  }

  async remove(id: string, user: IUser) {
    const book = await this.bookModel.findOne({
      _id: id,
      // $or: [
      //   { isDeleted: false },
      //   { isDeleted: { $exists: false } }
      // ]
    });
    if (!book) {
      throw new Error('Book not found');
    }
    return this.bookModel.deleteOne({ _id: id });
  }
}
