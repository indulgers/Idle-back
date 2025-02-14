import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('RolesGuard');
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    console.log('requiredRoles:', requiredRoles);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.roles) {
      return false;
    }
    // 超级管理员拥有全部权限，判断 user.roles 的 name 属性
    if (user.roles.find((r: any) => r.name === 'super_admin')) {
      return true;
    }
    // 检查是否至少拥有 requiredRoles 中的某个权限
    return requiredRoles.some((role) =>
      user.roles.find((r: any) => r.name === role),
    );
  }
}
