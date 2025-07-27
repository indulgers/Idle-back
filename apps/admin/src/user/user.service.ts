import { PrismaService } from '@app/prisma';
import {
  Inject,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { guid, ResultData } from '@app/common';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';
import { MINIPROGRAM_CONFIG } from 'apps/common/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class UserService {
  @Inject(PrismaService)
  private prisma: PrismaService;
  @Inject(JwtService)
  private jwtService: JwtService;

  async findUserList(query: { page: number; pageSize: number; name?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const where = query.name
      ? { username: { contains: query.name, mode: 'insensitive' } }
      : {};
    const [total, list] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        where: where,
        skip: skip,
        take: Number(pageSize),
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    return ResultData.ok({
      list,
      total,
      page,
      pageSize,
    });
  }

  async findUnique(where: Prisma.UserWhereUniqueInput) {
    return await this.prisma.user.findUnique({
      where,
    });
  }

  async login(where: LoginDto): Promise<ResultData> {
    const user = await this.prisma.admin.findFirst({
      where: {
        username: where.username,
      },
    });
    if (user.password !== where.password) {
      throw new UnauthorizedException('密码错误');
    }
    const payload = {
      id: user.id,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);
    return ResultData.ok({
      token,
      user,
    });
  }

  async registerAdmin(data: RegisterAdminDto): Promise<ResultData> {
    try {
      // 验证用户名是否已存在
      const existingAdmin = await this.prisma.admin.findFirst({
        where: {
          OR: [{ username: data.username }, { phone: data.phone }],
        },
      });

      if (existingAdmin) {
        if (existingAdmin.username === data.username) {
          throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
        }
        if (existingAdmin.phone === data.phone) {
          throw new HttpException('手机号已被注册', HttpStatus.BAD_REQUEST);
        }
      }

      // 验证社区是否存在
      const community = await this.prisma.community.findUnique({
        where: { id: data.communityId },
      });

      if (!community) {
        throw new HttpException('所选社区不存在', HttpStatus.BAD_REQUEST);
      }

      // 创建管理员
      const admin = await this.prisma.admin.create({
        data: {
          id: guid(),
          username: data.username,
          password: data.password, // 实际项目中应该对密码进行加密
          phone: data.phone,
          communityId: data.communityId,
          roleId: 'communityadmin', // 默认为社区管理员角色
        },
      });

      // 返回结果时删除密码
      const { password, ...adminWithoutPassword } = admin;
      return ResultData.ok(adminWithoutPassword, '注册成功');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('注册失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // async create(data: Prisma.UserCreateInput) {
  //   data.id = guid();
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       id: data.id,
  //     },
  //   });
  //   if (user) {
  //     throw new Error('User already exists');
  //   }

  //   return await this.prisma.user.create({
  //     data,
  //   });
  // }
}
