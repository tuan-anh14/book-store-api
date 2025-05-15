import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Model } from 'mongoose';
import { IUser } from 'src/users/user.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>
  ) { }

  async findAll() {
    return this.categoryModel.find().select('name');
  }

  async create(createCategoryDto: CreateCategoryDto, user: IUser) {
    const newCategory = await this.categoryModel.create({
      ...createCategoryDto,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    });
    return newCategory;
  }

  async update(updateCategoryDto: UpdateCategoryDto, user: IUser) {
    const updated = await this.categoryModel.updateOne(
      { _id: updateCategoryDto._id },
      {
        ...updateCategoryDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      }
    );
    return updated;
  }

  async remove(id: string, user: IUser) {
    return this.categoryModel.deleteOne({ _id: id });
  }
}
