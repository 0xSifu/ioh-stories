import {
    ExecutionContext,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ClientProxy } from '@nestjs/microservices';
  import { IS_PUBLIC_KEY } from 'src/app/app.constant';
  
  @Injectable()
  export class AuthGuard {
    constructor(
      private reflector: Reflector,
      @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    ) {}
  
    async canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      const isRpc = context.getType() === 'rpc';
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic || isRpc) {
        return true;
      }
      let token = request.headers['authorization'];
  
      if (!token) {
        throw new UnauthorizedException('accessTokenUnauthorized');
      }
      token = token.replace('Bearer ', '');
      console.log('DATA : ', token);
      const response = await this.authClient.send(
        'validateToken',
        JSON.stringify(token),
      );
  
      if (!response) {
        throw new HttpException(response, HttpStatus.BAD_REQUEST);
      }
      request.authUser = response;
      return true;
    }
  }
  