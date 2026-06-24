import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright';
import { ActionMap } from './actions/action.map';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  async runWorkflow(steps: any[]) {
    this.logger.log('Bắt đầu luồng automation...');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const runtimeContext = new Map<string, any>();

    try {
      for (const step of steps) {
        this.logger.log(`[Step ${step.id}] Thực thi hành động: ${step.action}`);
        const actionFn = ActionMap[step.action];
        if (!actionFn) {
          throw new Error(
            `Hành động '${step.action}' không tồn tại trong ActionMap!`,
          );
        }
        await actionFn(page, step, runtimeContext);
      }
      this.logger.log('🎉 Toàn bộ kịch bản chạy THÀNH CÔNG!');

      return runtimeContext;
    } catch (error) {
      this.logger.error(
        `❌ Kịch bản THẤT BẠI tại bước nào đó. Lỗi: ${error.message}`,
      );
      throw error;
    } finally {
      this.logger.log('🔒 Đóng trình duyệt, giải phóng bộ nhớ.');
      await browser.close();
    }
  }
}
