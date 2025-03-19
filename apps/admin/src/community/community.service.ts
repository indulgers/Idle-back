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

  async getCommunityTree() {
    // 获取所有社区数据
    const allCommunities = await this.prisma.community.findMany({
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
    console.log('mmm', allCommunities);
    // 构建层级树结构
    const buildTree = (items: any[], parentId: string | null = null) => {
      return items
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    // 从最顶层开始构建树
    const tree = buildTree(allCommunities);

    return ResultData.ok(tree);
  }

  // 添加根据级别获取社区列表的方法
  async getCommunityByLevel(level: number) {
    const communities = await this.prisma.community.findMany({
      where: { level },
      orderBy: { name: 'asc' },
    });

    return ResultData.ok(communities);
  }

  /**
   * 获取指定区下辖的街道和社区数据
   */
  async getDistrictSubordinates(
    districtId: string,
    includeStreets: boolean = true,
    includeCommunities: boolean = true,
  ) {
    try {
      // 先检查区是否存在
      const district = await this.prisma.community.findUnique({
        where: { id: districtId },
      });

      if (!district) {
        return ResultData.fail(404, '指定的区域不存在');
      }

      if (district.level !== 2) {
        return ResultData.fail(400, '提供的ID不是区级单位');
      }

      // 获取街道数据
      const streets = includeStreets
        ? await this.prisma.community.findMany({
            where: {
              parentId: districtId,
              level: 3,
            },
            orderBy: { name: 'asc' },
          })
        : [];

      // 获取社区数据
      let communities = [];

      if (includeCommunities) {
        if (includeStreets && streets.length > 0) {
          // 如果包含街道，获取这些街道下的所有社区
          const streetIds = streets.map((street) => street.id);
          communities = await this.prisma.community.findMany({
            where: {
              parentId: { in: streetIds },
              level: 4,
            },
            orderBy: { name: 'asc' },
          });
        } else {
          // 如果不包含街道，通过两级关系查询所有归属于这个区的社区
          // 先查出区下的所有街道ID
          const streetIds = (
            await this.prisma.community.findMany({
              where: { parentId: districtId, level: 3 },
              select: { id: true },
            })
          ).map((street) => street.id);

          // 再查询这些街道下的社区
          communities = await this.prisma.community.findMany({
            where: {
              parentId: { in: streetIds },
              level: 4,
            },
            orderBy: { name: 'asc' },
          });
        }
      }

      return ResultData.ok({
        district,
        streets: streets,
        communities: communities,
        // 返回简单统计数据
        stats: {
          streetCount: streets.length,
          communityCount: communities.length,
        },
      });
    } catch (error) {
      console.error('获取区域下辖数据失败:', error);
      return ResultData.fail(500, '获取区域下辖数据失败');
    }
  }
}
