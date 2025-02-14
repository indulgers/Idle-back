import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class FakeAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    // if (authHeader) {
    //   const token = authHeader.split(' ')[1]; // 例如 "Bearer demo-super-admin"
    //   if (token === 'demo-super-admin') {
    //     req.user = {
    //       username: 'super_admin_user',
    //       communityId: '1',
    //       roles: [
    //         {
    //           name: 'super_admin',
    //           id: '1',
    //           createTime: new Date(),
    //           updateTime: new Date(),
    //         },
    //       ],
    //     };
    //   } else if (token === 'demo-community-admin') {
    //     req.user = {
    //       username: 'community_admin_user',
    //       communityId: '1',
    //       roles: [
    //         {
    //           name: 'community_admin',
    //           id: '2',
    //           createTime: new Date(),
    //           updateTime: new Date(),
    //         },
    //       ],
    //     };
    //   }
    //   next();
    // }
  }
}
