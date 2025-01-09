// import {
//   Injectable,
//   NestInterceptor,
//   ExecutionContext,
//   CallHandler,
//   Logger,
// } from '@nestjs/common';
// import { tap } from 'rxjs';
// import { getClientIp } from 'request-ip';

// /**
//  * 统一日志上报拦截器
//  */

// @Injectable()
// export class LoggingInterceptor implements NestInterceptor {
//   private logger = new Logger(LoggingInterceptor.name);

//   async intercept(context: ExecutionContext, next: CallHandler) {
//     const now = Date.now();
//     const request = context.switchToHttp().getRequest();
//     const ip = getClientIp(request);
//     const body = JSON.stringify(request.body);
//     this.logger.log(
//       `StartLog: Path: ${request.url}; Method: ${request.method}; Body: ${body}; Ip: ${ip}`,
//     );
//     return next.handle().pipe(
//       tap((res) => {
//         this.logger.log(
//           `EndLog: Path: ${request.url}; Method: ${
//             request.method
//           }; Body: ${body}; Ip: ${ip};  Time: ${Date.now() - now}ms; Code: ${
//             res?.code
//           }; Msg: ${res?.msg}`,
//         );
//       }),
//     );
//   }
// }
export {};
