import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '@app/prisma';
import { JwtService } from '@nestjs/jwt';
import { MINIPROGRAM_CONFIG } from 'apps/common/config';
import { ResultData } from '@app/common';
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async wxLogin(
    code: string,
    userInfo?: { avatarUrl: string; nickName: string },
  ) {
    try {
      // 调用微信登录接口获取 openid
      const wxResponse = await axios.get(
        `${MINIPROGRAM_CONFIG.WX_LOGIN_REQUEST_URL}?appid=${MINIPROGRAM_CONFIG.WX_APP_ID}&secret=${MINIPROGRAM_CONFIG.WX_APP_SECRET}&js_code=${code}&grant_type=authorization_code`,
      );
      console.log('dsadas', wxResponse.data);
      if (wxResponse.data.errcode) {
        throw new HttpException('微信登录失败', HttpStatus.BAD_REQUEST);
      }

      const { openid } = wxResponse.data;

      // 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { openid },
      });

      if (!user) {
        // 创建新用户
        user = await this.prisma.user.create({
          data: {
            openid,
            username: `user_${openid.slice(-6)}`, // 生成默认用户名
            email: `${openid}@wx.user`, // 生成默认邮箱
            avatar: userInfo?.avatarUrl,
            nickname: userInfo?.nickName,
            communityId: 'default_community_id', // 设置默认社区
          },
        });
      } else if (userInfo) {
        // 更新用户信息
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            avatar: userInfo.avatarUrl,
            nickname: userInfo.nickName,
          },
        });
      }

      // 生成 JWT token
      const token = this.jwtService.sign({
        userId: user.id,
        openid: user.openid,
      });

      return ResultData.ok({ token, user }, '登录成功');
    } catch (error) {
      throw new HttpException(
        error.message || '登录失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
