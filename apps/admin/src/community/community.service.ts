import { Inject, Injectable } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { PrismaService } from '@app/prisma';
import { guid, ResultData } from '@app/common';
@Injectable()
export class CommunityService {
  @Inject(PrismaService)
  private prisma: PrismaService;
  async create(createCommunityDto: CreateCommunityDto) {
    // 生成唯一 id
    const id = guid();
    const community = await this.prisma.community.create({
      data: { id, ...createCommunityDto },
    });
    return community;
  }

  async findAll(query: { page?: number; pageSize?: number; name?: string }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const where = query.name
      ? { name: { contains: query.name, mode: 'insensitive' } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.community.count({ where }),
    ]);

    return ResultData.ok({
      list: data,
      pagination: {
        current: page,
        pageSize: pageSize,
        total,
      },
    });
  }

  async findOne(id: string) {
    return ResultData.ok(
      await this.prisma.community.findUnique({ where: { id } }),
    );
  }

  async update(id: string, updateCommunityDto: UpdateCommunityDto) {
    return ResultData.ok(
      await this.prisma.community.update({
        where: { id },
        data: updateCommunityDto,
      }),
    );
  }

  async remove(id: string) {
    return ResultData.ok(
      await this.prisma.community.delete({
        where: { id },
      }),
    );
  }
}
