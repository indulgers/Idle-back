import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { QueryDonationDto } from './dto/query-donation.dto';
import { ClaimDonationDto } from './dto/update-donation.dto';
import { FeedbackDonationDto } from './dto/update-donation.dto';
import { guid, ResultData } from '@app/common';
import { DonationStatus, Prisma } from '@prisma/client';

@Injectable()
export class DonationService {
  constructor(private prisma: PrismaService) {}

  // 创建捐赠
  async create(createDonationDto: CreateDonationDto) {
    try {
      // 创建捐赠记录
      const donation = await this.prisma.donation.create({
        data: {
          id: guid(),
          ...createDonationDto,
          images: Array.isArray(createDonationDto.images)
            ? JSON.stringify(createDonationDto.images)
            : createDonationDto.images,
          status: DonationStatus.PENDING,
          pointValue: createDonationDto.pointValue || 50, // 默认50积分
        },
      });

      return ResultData.ok(donation);
    } catch (error) {
      console.error('创建捐赠失败:', error);
      throw new HttpException('创建捐赠失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 查找所有捐赠
  async findAll(query: QueryDonationDto) {
    const {
      page = 1,
      pageSize = 10,
      communityId,
      userId,
      claimId,
      categoryId,
      status,
      eventId,
      keyword,
    } = query;

    try {
      const where: Prisma.DonationWhereInput = {
        ...(communityId && { communityId }),
        ...(userId && { userId }),
        ...(claimId && { claimId }),
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(eventId && { eventId }),
        // 关键词搜索
        ...(keyword && {
          OR: [
            { name: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        }),
      };

      const [total, items] = await Promise.all([
        this.prisma.donation.count({ where }),
        this.prisma.donation.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: Number(pageSize),
          orderBy: {
            createTime: 'desc',
          },
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
          },
        }),
      ]);

      return ResultData.ok({
        items,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      console.error('查询捐赠列表失败:', error);
      throw new HttpException(
        '查询捐赠列表失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 查找单个捐赠
  async findOne(id: string) {
    try {
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
    } catch (error) {
      console.error('查询捐赠详情失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        '查询捐赠详情失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 更新捐赠
  async update(id: string, updateDonationDto: UpdateDonationDto) {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id },
      });

      if (!donation) {
        throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
      }

      // 如果有分类ID，验证分类是否存在
      if (updateDonationDto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: updateDonationDto.categoryId },
        });

        if (!category) {
          throw new HttpException('分类不存在', HttpStatus.BAD_REQUEST);
        }
      }

      // 更新捐赠
      const updated = await this.prisma.donation.update({
        where: { id },
        data: {
          ...updateDonationDto,
          updateTime: new Date(),
        },
      });

      return ResultData.ok(updated);
    } catch (error) {
      console.error('更新捐赠失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('更新捐赠失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 审核捐赠
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

  // 领取捐赠
  async claim(claimDto: ClaimDonationDto) {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id: claimDto.donationId },
      });

      if (!donation) {
        throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
      }

      // 只能领取已审核的捐赠
      if (donation.status !== DonationStatus.APPROVED) {
        throw new HttpException('该捐赠不可领取', HttpStatus.BAD_REQUEST);
      }

      // 不能领取自己的捐赠
      if (donation.userId === claimDto.userId) {
        throw new HttpException('不能领取自己的捐赠', HttpStatus.BAD_REQUEST);
      }

      // 检查用户是否有足够的积分
      const userPoints = await this.prisma.point.aggregate({
        where: { userId: claimDto.userId },
        _sum: { amount: true },
      });

      const totalPoints = userPoints._sum.amount || 0;

      if (totalPoints < donation.pointValue) {
        throw new HttpException('积分不足', HttpStatus.BAD_REQUEST);
      }

      // 扣除积分
      await this.prisma.point.create({
        data: {
          id: guid(),
          userId: claimDto.userId,
          amount: -donation.pointValue, // 负值表示扣除积分
          createTime: new Date(),
          updateTime: new Date(),
        },
      });

      // 更新捐赠状态
      const updated = await this.prisma.donation.update({
        where: { id: claimDto.donationId },
        data: {
          status: DonationStatus.CLAIMED,
          claimId: claimDto.userId,
          claimTime: new Date(),
          updateTime: new Date(),
        },
      });

      return ResultData.ok(updated);
    } catch (error) {
      console.error('领取捐赠失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('领取捐赠失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 提交反馈
  async feedback(userId: string, feedbackDto: FeedbackDonationDto) {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id: feedbackDto.donationId },
      });

      if (!donation) {
        throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
      }

      // 只有领取者可以提交反馈
      if (donation.claimId !== userId) {
        throw new HttpException('只有领取者可以提交反馈', HttpStatus.FORBIDDEN);
      }

      // 只能对已领取的捐赠提交反馈
      if (donation.status !== DonationStatus.CLAIMED) {
        throw new HttpException(
          '该捐赠不处于已领取状态',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 检查是否已有反馈
      const existingFeedback = await this.prisma.donationFeedback.findUnique({
        where: { donationId: feedbackDto.donationId },
      });

      if (existingFeedback) {
        throw new HttpException('已经提交过反馈', HttpStatus.BAD_REQUEST);
      }

      // 创建反馈
      await this.prisma.donationFeedback.create({
        data: {
          id: guid(),
          donationId: feedbackDto.donationId,
          rating: feedbackDto.rating,
          comment: feedbackDto.comment,
          images: JSON.stringify(feedbackDto.images || []),
          createTime: new Date(),
          updateTime: new Date(),
        },
      });

      // 更新捐赠状态
      await this.prisma.donation.update({
        where: { id: feedbackDto.donationId },
        data: {
          status: DonationStatus.COMPLETED,
          updateTime: new Date(),
        },
      });

      // 反馈获得额外积分
      await this.prisma.point.create({
        data: {
          id: guid(),
          userId: donation.userId, // 给捐赠者加积分
          amount: 20, // 额外20积分
          createTime: new Date(),
          updateTime: new Date(),
        },
      });

      return ResultData.ok(null, '反馈提交成功');
    } catch (error) {
      console.error('提交反馈失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('提交反馈失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 取消捐赠
  async cancel(id: string, userId: string) {
    try {
      const donation = await this.prisma.donation.findUnique({
        where: { id },
      });

      if (!donation) {
        throw new HttpException('捐赠不存在', HttpStatus.NOT_FOUND);
      }

      // 只有捐赠者可以取消捐赠
      if (donation.userId !== userId) {
        throw new HttpException('只有捐赠者可以取消捐赠', HttpStatus.FORBIDDEN);
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
}
