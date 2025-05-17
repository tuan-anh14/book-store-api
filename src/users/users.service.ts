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
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';

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

  async findAll() {
    const result = await this.userModel.find()
      .select('-password -__v -refreshToken')
      .exec();

    return result;
  }

  async findAllPaginate(currentPage: number, limit: number, qs: string) {
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
        current: currentPage, //trang hiện tại 
        pageSize: limit, //số lượng bản ghi đã lấy 
        pages: totalPages,  //tổng số trang với điều kiện query 
        total: totalItems // tổng số phần tử (số bản ghi) 
      },
      result //kết quả query 
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

  updateUserToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne({ _id }, { refreshToken });
  }

  findUserByToken = async (refreshToken: string) => {
    return await this.userModel.findOne({ refreshToken })
  }

  async bulkCreate(users: CreateUserDto[], user: IUser) {
    const createdUsers = [];

    for (const u of users) {
      const isExist = await this.userModel.findOne({ email: u.email });
      if (isExist) continue; // Bỏ qua nếu tồn tại

      const hashPassword = this.getHashPassword(u.password);
      const createdUser = await this.userModel.create({
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        password: hashPassword,
        role: u.role || 'USER', // Default role
      });

      createdUsers.push(createdUser);
    }

    return {
      message: `Đã tạo ${createdUsers.length} người dùng thành công`,
      data: createdUsers.map(user => ({
        _id: user._id,
        email: user.email
      }))
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const { email, oldpass, newpass } = changePasswordDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Email không tồn tại');
    }

    // Check old password
    const isMatch = compareSync(oldpass, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    // Hash new password
    const hashPassword = this.getHashPassword(newpass);

    // Update password
    return this.userModel.updateOne(
      { email },
      {
        $set: {
          password: hashPassword,
          updatedAt: new Date()
        }
      }
    );
  }

  async updateUserInfo(updateUserInfoDto: UpdateUserInfoDto) {
    const { _id, fullName, phone, avatar } = updateUserInfoDto;

    return this.userModel.updateOne(
      { _id },
      {
        $set: {
          fullName,
          phone,
          avatar,
          updatedAt: new Date()
        }
      }
    );
  }

}