// src/auth-keeper/auth-keeper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutomationService } from '../automation/automation.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class AuthKeeperService {
  private readonly logger = new Logger(AuthKeeperService.name);

  constructor(
    private readonly automationService: AutomationService,
    private readonly redisService: RedisService,
  ) {}
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleRefreshSessionJob() {
    this.logger.log(
      '🔑 [Cron] Khởi động tiến trình làm mới Session cho toàn bộ hệ thống đài...',
    );

    const sites = [
      {
        code: 'F8BET',
        loginUrl: 'https://f8betbbe.com/login',
        user: 'testcong',
        pass: 'mật_khẩu_bảo_mật_123',
      },
    ];

    for (const site of sites) {
      try {
        await this.loginAndSaveSession(site);
      } catch (error) {
        this.logger.error(
          `❌ Tiến trình nuôi tài khoản đài [${site.code}] THẤT BẠI: ${error.message}`,
        );
      }
    }
  }

  private async loginAndSaveSession(site: {
    code: string;
    loginUrl: string;
    user: string;
    pass: string;
  }) {
    this.logger.log(
      `🔄 Đang nạp kịch bản đăng nhập đài [${site.code}] với tài khoản: ${site.user}`,
    );

    const loginScript = [
      { id: '1', action: 'GOTO', url: 'https://f8betbbe.com/' },
      {
        id: '2',
        action: 'CLICK',
        selector: 'role=checkbox[name="Không hiển thị nữa"]',
      },
      { id: '3', action: 'CLICK', selector: 'role=button >> nth=0' },
      { id: '4', action: 'CLICK', selector: 'text=Đóng' },
      { id: '5', action: 'CLICK', selector: 'role=button[name="Đăng nhập"]' },
      { id: '5.5', action: 'WAIT_TIMEOUT', value: '1500' },
      {
        id: '6',
        action: 'INPUT',
        selector: 'role=textbox[name="Tên đăng nhập"]',
        value: 'testcong3',
      },
      {
        id: '7',
        action: 'INPUT',
        selector: 'role=textbox[name="Mật khẩu"]',
        value: 'a123123',
      },
      { id: '7.5', action: 'WAIT_TIMEOUT', value: '1000' },
      {
        id: '8',
        action: 'CLICK' as const,
        selector: 'form button[type="submit"]',
      },

      { id: '9', action: 'WAIT_TIMEOUT' as const, value: '5000' },

      { id: '10', action: 'SAVE_SESSION' as const },
    ];

    const resultContext = await this.automationService.runWorkflow(loginScript);

    if (resultContext && resultContext.has('saved_session')) {
      const storageState = resultContext.get('saved_session');
      const redisKey = `session:${site.code}`;
      const ttlInSeconds = 45 * 60;

      await this.redisService.set(redisKey, storageState, ttlInSeconds);

      this.logger.log(
        `💾 [Redis] Cập nhật thành công Session cho đài [${site.code}]. Hết hạn sau 30 phút.`,
      );
    } else {
      throw new Error(
        'Luồng chạy hoàn tất nhưng không tìm thấy dữ liệu cấu trúc session trong context',
      );
    }
  }
}
