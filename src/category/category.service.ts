import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Model } from 'mongoose';
import { IUser } from 'src/users/user.interface';
import aqp from 'api-query-params';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>
  ) { }

  async findAll() {
    return this.categoryModel.find().exec();
  }

  async findAllPaginate(currentPage: number, limit: number, qs: string) {
    const { filter, projection, population, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.categoryModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.categoryModel.find(filter)
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

  async findOne(id: string) {
    return this.categoryModel.findOne({ _id: id }).exec();
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const newCategory = await this.categoryModel.create({
      ...createCategoryDto
    });
    return newCategory;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findOne({ _id: id });
    if (!category) {
      throw new Error('Category not found');
    }

    await this.categoryModel.updateOne(
      { _id: id },
      {
        $set: {
          ...updateCategoryDto,
          updatedAt: new Date()
        }
      }
    );

    // Return the updated category with timestamps
    return this.categoryModel.findOne({ _id: id }).exec();
  }

  async remove(id: string) {
    return this.categoryModel.deleteOne({ _id: id });
  }
}
