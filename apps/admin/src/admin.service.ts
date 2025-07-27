import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { VerificationStatus } from '@prisma/client';
import { ResultData } from '@app/common';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * 获取待审核的管理员列表
   */
  async getPendingAdmins() {
    try {
      const admins = await this.prisma.admin.findMany({
        where: {
          status: VerificationStatus.PENDING,
        },
        include: {
          Community: true,
        },
      });

      return ResultData.ok(admins);
    } catch (error) {
      console.error('获取待审核管理员失败:', error);
      throw new HttpException(
        '获取待审核管理员失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 审核管理员
   */
  async verifyAdmin(
    adminId: string,
    status: VerificationStatus,
    verifyNote: string,
    verifiedBy: string,
  ) {
    try {
      // 检查管理员是否存在
      const admin = await this.prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        throw new HttpException('管理员不存在', HttpStatus.NOT_FOUND);
      }

      // 检查管理员是否已经审核过
      if (admin.status !== VerificationStatus.PENDING) {
        throw new HttpException('该管理员已经审核过', HttpStatus.BAD_REQUEST);
      }
      const roleData = {
        status,
        verifyTime: new Date(),
        verifyNote,
        verifiedBy,
      };

      // 如果roleId为null或无效，设置为默认值'admin'
      if (!admin.roleId) {
        roleData['roleId'] = 'admin'; // 默认为社区管理员角色
      }
      console.log('审核管理员:', admin);
      // 更新管理员状态
      const updatedAdmin = await this.prisma.admin.update({
        where: { id: adminId },
        data: roleData,
        include: {
          // 修改为可选关联
          role: true,
          Community: true,
        },
      });

      return ResultData.ok(updatedAdmin);
    } catch (error) {
      console.error('审核管理员失败:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        '审核管理员失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取所有管理员列表
   */
  async getAllAdmins() {
    try {
      const admins = await this.prisma.admin.findMany({
        include: {
          Community: true,
          verifier: true,
        },
      });

      return ResultData.ok(admins);
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      throw new HttpException(
        '获取管理员列表失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
