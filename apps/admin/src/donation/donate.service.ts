import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { guid, ResultData } from '@app/common';
import { DonationStatus, Prisma } from '@prisma/client';

@Injectable()
export class DonateService {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async create(dto: any) {
    const id = guid();
    return await this.prisma.donation.create({
      data: { id, ...dto },
    });
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    status?: DonationStatus;
    keyword?: string;
    communityId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Prisma.DonationWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.communityId && { communityId: query.communityId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      // 关键词搜索
      ...(query.keyword && {
        OR: [
          { name: { contains: query.keyword } },
          { description: { contains: query.keyword } },
          { user: { nickname: { contains: query.keyword } } },
        ],
      }),
      // 日期范围
      ...(query.startDate && {
        createTime: {
          gte: new Date(query.startDate),
          ...(query.endDate && { lte: new Date(query.endDate) }),
        },
      }),
    };
    console.log('where:', where);
    const [data, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createTime: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          category: true,
          claimer: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          feedback: true,
          event: true,
        },
      }),
      this.prisma.donation.count({ where }),
    ]);
    console.log('data:', data);
    return ResultData.ok({
      items: data,
      total: total,
      page,
      pageSize,
    });
  }

  async findOne(id: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        category: true,
        claimer: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        feedback: true,
        event: true,
      },
    });

    if (!donation) {
      throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
    }

    return ResultData.ok(donation);
  }

  async update(id: string, dto: any) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
    });

    if (!donation) {
      throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
    }

    return ResultData.ok(
      await this.prisma.donation.update({
        where: { id },
        data: dto,
      }),
    );
  }

  // 管理员审核捐赠
  async verify(id: string, status: DonationStatus, verifyNote?: string) {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id },
      });

      if (!donation) {
        throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
      }

      // 只能审核待审核的捐赠
      if (donation.status !== DonationStatus.PENDING) {
        throw new HttpException(
          '该捐赠不处于待审核状态',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 更新捐赠状态
      const updated = await this.prisma.donation.update({
        where: { id },
        data: {
          status,
          verifyNote,
          verifyTime: new Date(),
          updateTime: new Date(),
        },
      });

      // 如果审核通过，给捐赠者增加积分
      if (status === DonationStatus.APPROVED) {
        await this.prisma.point.create({
          data: {
            id: guid(),
            userId: donation.userId,
            amount: donation.pointValue,
            createTime: new Date(),
            updateTime: new Date(),
          },
        });
      }

      return ResultData.ok(updated);
    } catch (error) {
      console.error('审核捐赠失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('审核捐赠失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 管理员取消捐赠
  async adminCancel(id: string, reason: string) {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id },
      });

      if (!donation) {
        throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
      }

      // 只能取消待审核或已审核的捐赠
      if (
        donation.status !== DonationStatus.PENDING &&
        donation.status !== DonationStatus.APPROVED
      ) {
        throw new HttpException('该捐赠状态不可取消', HttpStatus.BAD_REQUEST);
      }

      // 更新捐赠状态
      const updated = await this.prisma.donation.update({
        where: { id },
        data: {
          status: DonationStatus.CANCELED,
          verifyNote: reason,
          updateTime: new Date(),
        },
      });

      return ResultData.ok(updated);
    } catch (error) {
      console.error('取消捐赠失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('取消捐赠失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: string) {
    const donation = await this.prisma.donation.findUnique({ where: { id } });

    if (!donation) {
      throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
    }

    // 只能删除已取消的捐赠
    if (donation.status !== DonationStatus.CANCELED) {
      throw new HttpException('只能删除已取消的捐赠', HttpStatus.BAD_REQUEST);
    }

    return ResultData.ok(await this.prisma.donation.delete({ where: { id } }));
  }
}
