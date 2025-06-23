import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateVoucherDto } from './dto/CreateVoucher.dto';
import { GetVoucherDto } from './dto/GetVoucher.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('vouchers')
  async create(@Body() dto: CreateVoucherDto): Promise<GetVoucherDto | null> {
    try {
      console.log(dto);
      const voucher = await this.appService.createVoucher(dto);
      if (voucher) {
        console.log(voucher);
        return {
          ...voucher,
          dataCapBytes: Number(voucher?.dataCapBytes.toString()), // or use Number() if safe
        };
      }
      return null;
    } catch (_) {
      console.log('GGAGAG');
      console.log(_);
      return null;
    }
  }
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
