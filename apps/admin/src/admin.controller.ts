import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { Roles } from '../../common/decorator/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, VerificationStatus } from '@prisma/client';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { VerifyAdminDto } from './admin/dto/verify-admin.dto';

declare module 'express' {
  interface Request {
    user: {
      username: string;
      id: string;
      communityId: string;
      roles: Role[];
    };
  }
}

@Controller('')
@ApiTags('admin')
// @UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 示例：查询社区数据，要求社区管理员或者超级管理员
  // @Get('community/:communityId')
  // @Roles('community_admin')
  // async getCommunityData(
  //   @Param('communityId') communityId: string,
  //   @Req() req: Request,
  // ) {
  //   console.log(1111, req.user);
  //   console.log(2222, communityId);
  //   const user = req.user; // 假设已经在 auth guard 中注入了用户信息
  //   // 如果用户是社区管理员，需要验证该管理员是否管理当前请求的社区，可在此处添加额外判断
  //   if (
  //     user.roles.some((role) => role.name === 'community_admin') &&
  //     user.communityId !== communityId
  //   ) {
  //     throw new Error('无权限操作其它社区数据');
  //   }
  //   // 返回该社区的数据
  //   return { communityId, data: '这里是社区数据' };
  // }

  // 示例：超级管理员接口，管理所有社区的数据
  @Get('all')
  // @Roles('super_admin')
  @ApiOperation({ summary: '获取所有社区数据' })
  async getAllCommunityData() {
    // 仅超级管理员才能访问
    return { data: '所有社区的数据' };
  }

  /**
   * 获取待审核的管理员列表
   */
  @Get('pending')
  // @Roles('super_admin')
  @ApiOperation({ summary: '获取待审核的管理员列表' })
  async getPendingAdmins() {
    return this.adminService.getPendingAdmins();
  }

  /**
   * 审核管理员
   */
  @Put('verify/:id')
  @ApiOperation({ summary: '审核管理员' })
  @ApiParam({ name: 'id', description: '管理员ID' })
  @ApiBody({ type: VerifyAdminDto })
  async verifyAdmin(
    @Param('id') id: string,
    @Body() verifyAdminDto: VerifyAdminDto,
  ) {
    // 映射外部状态名称到实际的枚举值
    const statusMap = {
      APPROVED: VerificationStatus.VERIFIED,
      REJECTED: VerificationStatus.REJECTED,
    };

    // 使用映射后的状态或原始状态
    const status = statusMap[verifyAdminDto.status] || verifyAdminDto.status;

    // 临时使用固定的超级管理员ID
    const verifierId = 'superadmin';

    return this.adminService.verifyAdmin(
      id,
      status,
      verifyAdminDto.verifyNote || '',
      verifierId,
    );
  }

  /**
   * 获取所有管理员列表
   */
  @Get('list')
  // @Roles('super_admin')
  @ApiOperation({ summary: '获取所有管理员列表' })
  async getAllAdmins() {
    return this.adminService.getAllAdmins();
  }
}
