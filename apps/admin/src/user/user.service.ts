import { PrismaService } from '@app/prisma';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { guid, ResultData } from '@app/common';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';
import { MINIPROGRAM_CONFIG } from 'apps/common/config';
import { JwtService } from '@nestjs/jwt';
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
      pagination: {
        current: page,
        pageSize: pageSize,
        total,
      },
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
