import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Roles } from '../../common/decorator/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';
declare module 'express' {
  interface Request {
    user: {
      username: string;
      communityId: string;
      roles: Role[];
    };
  }
}
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  // 示例：查询社区数据，要求社区管理员或者超级管理员
  @Get('community/:communityId')
  @Roles('community_admin')
  async getCommunityData(
    @Param('communityId') communityId: string,
    @Req() req: Request,
  ) {
    console.log(1111, req.user);
    console.log(2222, communityId);
    const user = req.user; // 假设已经在 auth guard 中注入了用户信息
    // 如果用户是社区管理员，需要验证该管理员是否管理当前请求的社区，可在此处添加额外判断
    if (
      user.roles.some((role) => role.name === 'community_admin') &&
      user.communityId !== communityId
    ) {
      throw new Error('无权限操作其它社区数据');
    }
    // 返回该社区的数据
    return { communityId, data: '这里是社区数据' };
  }

  // 示例：超级管理员接口，管理所有社区的数据
  @Get('all')
  @Roles('super_admin')
  async getAllCommunityData() {
    // 仅超级管理员才能访问
    return { data: '所有社区的数据' };
  }
}
