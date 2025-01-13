export class RegisterUserDto {
  username: string;

  email: string;
}
export interface CreateUserDto {
  username: string;
  email?: string;
  roleId?: string;
}
