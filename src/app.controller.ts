import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    console.log('Hello World!');

    return {
      allow: true,
      timeout: 3600,
      up: 524288,
      down: 2097152,
      message: 'Access granted by remote FAS',
    };
  }
}
