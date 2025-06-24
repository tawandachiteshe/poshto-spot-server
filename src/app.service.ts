import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateVoucherDto } from './dto/CreateVoucher.dto';
import { Prisma } from '@prisma/client';
import * as dayjs from 'dayjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateVoucherBatchDto } from './dto/VoucherBatchDto';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(AppService.name);

  async createBatch(dto: CreateVoucherBatchDto) {
    try {
      const voucherBatch = await this.prisma.voucherBatch.create({
        data: {
          name: dto.name,
          batchSize: dto.batchSize,
        },
      });

      if (!voucherBatch) return null;
      for (let i = 0; i < dto.batchSize; i++) {
        const voucher = await this.createVoucher({
          gb: dto.gb,
          price: dto.price,
          expireDays: dto.expireDays,
        });

        if (voucher) {
          await this.prisma.voucher.update({
            where: { id: voucher.id },
            data: {
              voucherBatchId: voucherBatch.id,
            },
          });
        }
      }
      const batchWithVouchers = await this.prisma.voucherBatch.findUnique({
        where: { id: voucherBatch.id },
        include: {
          vouchers: true,
        },
      });

      const batchVouchers = batchWithVouchers?.vouchers?.map((vo) => {
        return {
          ...vo,
          dataCapBytes: Number(vo.dataCapBytes.toString()), // or use Number() if safe
        };
      });

      return {
        ...batchWithVouchers,
        vouchers: batchVouchers,
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Cron('*/10 * * * *') // every 10 minutes
  async disableUsedUpDataVouchers() {
    const activeVouchers = await this.prisma.voucher.findMany({
      where: { isActive: true },
    });

    for (const voucher of activeVouchers) {
      const username = voucher.code;
      const dataCap = voucher.dataCapBytes;

      // 1. Get total data usage from radacct (input + output)
      const usage = await this.prisma.radacct.aggregate({
        where: { username },
        _sum: {
          acctinputoctets: true,
          acctoutputoctets: true,
        },
      });

      const totalUsed =
        BigInt(usage._sum.acctinputoctets || 0) +
        BigInt(usage._sum.acctoutputoctets || 0);

      // 2. Compare usage with cap
      if (totalUsed >= BigInt(dataCap)) {
        await this.prisma.voucher.update({
          where: { code: username },
          data: { isActive: false },
        });

        // 3. Add `Auth-Type := Reject` to prevent login
        await this.prisma.radcheck.create({
          data: {
            username,
            attribute: 'Auth-Type',
            op: ':=',
            value: 'Reject',
          },
        });

        this.logger.log(
          `Voucher ${username} disabled (used ${totalUsed} / ${dataCap} bytes)`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES) // or EVERY_HOUR / EVERY_DAY_AT_MIDNIGHT
  async invalidateExpiredVouchers(): Promise<void> {
    const now = new Date();

    const result = await this.prisma.voucher.updateMany({
      where: {
        isActive: true,
        expiry: { lt: now },
      },
      data: {
        isActive: false,
      },
    });

    if (result.count > 0) {
      this.logger.log(`⛔ Invalidated ${result.count} expired vouchers`);
    }

    const expiredVouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: false,
        expiry: { lt: now },
      },
      select: { code: true },
    });

    await Promise.all(
      expiredVouchers.map((v) =>
        this.prisma.radcheck.updateMany({
          where: { username: v.code },
          data: { attribute: 'Auth-Type', op: ':=', value: 'Reject' },
        }),
      ),
    );
  }

  @Cron('*/10 * * * *') // Every 10 minutes
  async disableUsedUpVouchers() {
    this.logger.log('Checking vouchers that exceeded Session-Timeout...');

    // 1. Get all vouchers that are still active
    const activeVouchers = await this.prisma.voucher.findMany({
      where: { isActive: true },
    });

    for (const voucher of activeVouchers) {
      const username = voucher.code;

      // 2. Get Session-Timeout for this user from radreply
      const timeoutEntry = await this.prisma.radreply.findFirst({
        where: {
          username,
          attribute: 'Session-Timeout',
        },
      });

      if (!timeoutEntry) continue;

      const sessionLimit = parseInt(timeoutEntry.value); // in seconds

      // 3. Sum total session time from radacct
      const sessions = await this.prisma.radacct.aggregate({
        where: { username },
        _sum: {
          acctsessiontime: true,
        },
      });

      const totalTime = sessions._sum.acctsessiontime || 0;

      // 4. Disable voucher if session time >= limit
      if (totalTime >= sessionLimit) {
        await this.prisma.voucher.update({
          where: { code: username },
          data: { isActive: false },
        });
        await this.prisma.radcheck.create({
          data: {
            username,
            attribute: 'Auth-Type',
            op: ':=',
            value: 'Reject',
          },
        });

        this.logger.log(
          `Disabled ${username} (used ${totalTime}s / ${sessionLimit}s)`,
        );
      }
    }
  }

  private generateCode(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return [...Array<string>(length)]
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
  }

  async getRecentSessions() {
    const sessions = await this.prisma.radacct.findMany({
      orderBy: { acctstarttime: 'desc' },
      take: 100,
      select: {
        username: true,
        acctsessiontime: true,
        acctinputoctets: true,
        acctoutputoctets: true,
        acctstarttime: true,
        acctstoptime: true,
      },
    });

    return sessions.map((s) => ({
      username: s.username,
      session_time: s.acctsessiontime,
      input_octets: s.acctinputoctets?.toString(),
      output_octets: s.acctoutputoctets?.toString(),
      start_time: s.acctstarttime,
      stop_time: s.acctstoptime,
    }));
  }

  async createVoucher(
    dto: CreateVoucherDto,
  ): Promise<Prisma.VoucherGetPayload<null> | null> {
    const code = this.generateCode();
    const dataCapBytes = dto.gb * 1024 * 1024 * 1024;
    const expiration = dayjs(new Date()).add(+dto.expireDays, 'day'); // Expire after 3 days
    const sessionInSeconds = 3600 * 24 * dto.expireDays;

    try {
      const voucher = await this.prisma.voucher.create({
        data: {
          code,
          dataCapBytes: Math.floor(dataCapBytes),
          price: dto.price,
          timeCapSeconds: sessionInSeconds,
          isActive: true,
          expiryDays: dto.expireDays,
          expiry: expiration.toISOString(),
        },
      });

      await this.prisma.radcheck.createMany({
        data: [
          {
            username: code,
            attribute: 'Session-Timeout',
            op: ':=',
            value: sessionInSeconds.toString(), // 1 hour in seconds
          },
          {
            username: code,
            attribute: 'Auth-Type',
            op: ':=',
            value: 'Accept',
          },
          {
            username: code,
            attribute: 'Cleartext-Password',
            op: ':=',
            value: code,
          },
        ],
      });

      await this.prisma.radreply.createMany({
        data: [
          {
            username: code,
            attribute: 'Session-Timeout',
            op: ':=',
            value: sessionInSeconds.toString(), // 1 hour in seconds
          },
          {
            username: code,
            attribute: 'ChilliSpot-Max-Total-Octets',
            op: ':=',
            value: dataCapBytes.toString(),
          },
          {
            username: code,
            attribute: 'Simultaneous-Use',
            op: ':=',
            value: '1',
          },
        ],
      });

      return voucher;
    } catch (_) {
      console.log(_);
      return null;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
