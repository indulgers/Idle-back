import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { guid, ResultData } from '@app/common';
import axios from 'axios';
import { LoginData } from './types/user';
import { MINIPROGRAM_CONFIG } from 'apps/common/config';
@Injectable()
export class UserService {
  getHello(): string {
    return 'Hello World!';
  }

  @Inject(PrismaService)
  private prisma: PrismaService;

  async findUserList(page: number = 0, limit: number = 10) {
    const [total, list] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip: page * limit,
        take: limit,
        orderBy: {
          createTime: 'desc',
        },
      }),
    ]);

    return ResultData.ok({
      list,
      pagination: {
        current: page,
        pageSize: limit,
        total,
      },
    });
  }

  // async findUnique(where: Prisma.UserWhereUniqueInput) {
  //   return await this.prisma.user.findUnique({
  //     where,
  //   });
  // }

  async login(data: LoginData) {
    const result = await axios.get(
      `${MINIPROGRAM_CONFIG.WX_LOGIN_REQUEST_URL}?appid=${MINIPROGRAM_CONFIG.WX_APP_ID}&secret=${MINIPROGRAM_CONFIG.WX_APP_SECRET}&js_code=${data.code}&grant_type=authorization_code`,
    );
    console.log(result.data);
    return ResultData.ok(result.data);
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
