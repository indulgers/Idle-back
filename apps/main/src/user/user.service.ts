import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@app/prisma';
import { JwtService } from '@nestjs/jwt';
import { ResultData } from '@app/common';
import axios from 'axios';
import { MINIPROGRAM_CONFIG } from 'apps/common/config';
import { guid } from '@app/common';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async onModuleInit() {
    try {
      // 测试缓存连接
      await this.cache.set('test', 'hello');
      const testValue = await this.cache.get('test');
      console.log('Redis连接测试:', testValue);
      await this.cache.del('test');
    } catch (error) {
      console.error('Redis连接失败:', error);
    }
  }
  // 生成随机验证码
  private generateCode(): string {
    return Math.random().toString().slice(-6);
  }

  // 发送短信验证码
  async sendSmsCode(phone: string) {
    console.log('phone', phone);
    try {
      // 生成验证码
      const code = this.generateCode();
      console.log('code', code);
      // 调用短信服务发送验证码
      const response = {} as any;

      // if (response.data.code !== 200) {
      //   throw new Error('短信发送失败');
      // }
      console.log('验证码：', code);
      // 使用 cache-manager 存储验证码
      await this.cache.set(`sms:${phone}`, code, 300); // 5分钟过期
      console.log(await this.cache.get(`sms:${phone}`));

      return ResultData.ok(code, '验证码发送成功');
    } catch (error) {
      throw new HttpException(
        '验证码发送失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 手机号登录
  async phoneLogin(phone: string, code: string) {
    try {
      // 从缓存获取验证码
      const savedCode = await this.cache.get<string>(`sms:${phone}`);

      if (!savedCode || savedCode !== code) {
        throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
      }

      // 查找或创建用户
      let user = await this.prisma.user.findFirst({
        where: { phone },
      });

      if (!user) {
        // 创建新用户
        user = await this.prisma.user.create({
          data: {
            phone,
            username: `user_${phone.slice(-4)}`,
            email: `${phone}@phone.user`,
            communityId: 'default_community_id',
          },
        });
      }

      // 生成 token
      const token = this.jwtService.sign({
        userId: user.id,
        phone: user.phone,
      });

      // 删除验证码
      await this.cache.del(`sms:${phone}`);

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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || '登录失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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
            id: guid(), // 使用openid作为用户ID
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
