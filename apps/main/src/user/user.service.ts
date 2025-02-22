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

  // 获取微信 access_token
  private async getAccessToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${MINIPROGRAM_CONFIG.WX_APP_ID}&secret=${MINIPROGRAM_CONFIG.WX_APP_SECRET}`;
    const response = await axios.get(url);
    if (response.data.errcode) {
      throw new HttpException('获取access_token失败', HttpStatus.BAD_REQUEST);
    }
    return response.data.access_token;
  }

  // 获取手机号
  private async getPhoneNumber(phoneCode: string, accessToken: string) {
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
    const response = await axios.post(url, { code: phoneCode });

    if (response.data.errcode !== 0) {
      throw new HttpException('获取手机号失败', HttpStatus.BAD_REQUEST);
    }

    return response.data.phone_info.phoneNumber;
  }

  async login({ code, phoneCode }: { code: string; phoneCode: string }) {
    try {
      // 1. 获取 openid
      const wxResponse = await axios.get(
        `${MINIPROGRAM_CONFIG.WX_LOGIN_REQUEST_URL}?appid=${MINIPROGRAM_CONFIG.WX_APP_ID}&secret=${MINIPROGRAM_CONFIG.WX_APP_SECRET}&js_code=${code}&grant_type=authorization_code`,
      );

      if (wxResponse.data.errcode) {
        throw new HttpException('微信登录失败', HttpStatus.BAD_REQUEST);
      }

      const { openid } = wxResponse.data;

      // 2. 获取 access_token
      const accessToken = await this.getAccessToken();

      // 3. 获取手机号
      const phoneNumber = await this.getPhoneNumber(phoneCode, accessToken);

      // 4. 查找或创建用户
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ openid }, { phone: phoneNumber }],
        },
      });

      if (!user) {
        // 创建新用户
        user = await this.prisma.user.create({
          data: {
            openid,
            phone: phoneNumber,
            username: `user_${phoneNumber.slice(-4)}`,
            email: `${openid}@wx.user`,
            communityId: 'default_community_id',
          },
        });
      } else if (!user.openid) {
        // 如果用户存在但没有 openid，更新用户信息
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { openid },
        });
      }

      // 5. 生成 token
      const token = this.jwtService.sign({
        userId: user.id,
        openid: user.openid,
        phone: user.phone,
      });

      return ResultData.ok(
        {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            nickname: user.nickname,
            avatar: user.avatar,
          },
        },
        '登录成功',
      );
    } catch (error) {
      throw new HttpException(
        error.message || '登录失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
