import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CreateVoucherDto } from './dto/CreateVoucher.dto';
import { GetVoucherDto } from './dto/GetVoucher.dto';
import { PrismaService } from 'nestjs-prisma';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  // Simpler: Expect username passed in headers or session (for MVP)
  @Get('my-usage')
  async getMyUsage(@Query('x-user') username: string) {
    if (!username) {
      throw new UnauthorizedException('Missing username');
    }

    const usage = await this.prisma.radacct.aggregate({
      where: { username },
      _sum: {
        acctsessiontime: true,
        acctinputoctets: true,
        acctoutputoctets: true,
      },
      _max: {
        acctstarttime: true,
      },
    });

    const usedData =
      BigInt(usage._sum.acctinputoctets || 0) +
      BigInt(usage._sum.acctoutputoctets || 0);

    return {
      username,
      usedData: usedData.toString(),
      sessionTime: usage._sum.acctsessiontime || 0,
      lastSeen: usage._max.acctstarttime,
    };
  }

  @Get('dashboard')
  async getVoucherDashboard() {
    const vouchers = await this.prisma.voucher.findMany({
      where: {},
    });

    return await Promise.all(
      vouchers.map(async (v) => {
        const usage = await this.prisma.radacct.aggregate({
          where: { username: v.code },
          _sum: {
            acctinputoctets: true,
            acctoutputoctets: true,
            acctsessiontime: true,
          },
        });

        const usedData =
          BigInt(usage._sum.acctinputoctets || 0) +
          BigInt(usage._sum.acctoutputoctets || 0);

        const usedTime = usage._sum.acctsessiontime || 0;

        return {
          code: v.code,
          isActive: v.isActive,
          dataCap: v.dataCapBytes.toString(),
          usedData: usedData.toString(),
          timeCap: v.timeCapSeconds,
          usedTime,
          status:
            !v.isActive ||
            usedData >= BigInt(v.dataCapBytes) ||
            usedTime >= v.timeCapSeconds
              ? 'expired'
              : 'active',
        };
      }),
    );
  }

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
