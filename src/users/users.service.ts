import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User as UserM, UserDocument } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { IUser } from './user.interface';
import { User } from 'src/decorator/customize';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserM.name)
    private userModel: Model<UserDocument>
  ) { }

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  async create(createUserDto: CreateUserDto, @User() user: IUser) {
    const { email, fullName, password, address, phone, role } = createUserDto;

    const isExist = await this.userModel.findOne({ email });
    if (isExist) {
      throw new BadRequestException('Email đã tồn tại. Vui lòng sử dụng email khác!');
    }
    const hashPassword = this.getHashPassword(password);

    let newUser = await this.userModel.create({
      email, fullName, password: hashPassword, address, phone, role
    })
    return newUser;
  }

  async register(user: RegisterUserDto) {
    const { email, password, fullName, address, phone } = user;

    const isExist = await this.userModel.findOne({ email });
    if (isExist) {
      throw new BadRequestException('Email đã tồn tại. Vui lòng sử dụng email khác!');
    }
    const hashPassword = this.getHashPassword(password);

    let newRegister = await this.userModel.create({
      fullName, email, password: hashPassword, address, phone, role: 'USER'
    })
    return newRegister;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, projection, population, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population)
      .select('-password -__v -refreshToken')
      .exec();

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems
      },
      result
    }
  }

  findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return `not found user`;

    return this.userModel.findOne({
      _id: id
    }).select('-password -__v -refreshToken')
  }

  findOneByUsername(username: string) {
    return this.userModel.findOne({
      email: username
    })
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    const updated = await this.userModel.updateOne(
      { _id: updateUserDto._id },
      {
        ...updateUserDto,
      },
    );
    return updated;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'not found user';
    }

    return this.userModel.deleteOne({ _id: id });
  }
}