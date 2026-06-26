// src/modules/notification/telegram.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || '';
  }

  async onModuleInit() {
    this.logger.log(
      '⏳ Đang chạy thử nghiệm bắn tin liên kết tới Telegram API...',
    );
    try {
      await this.sendMessage(
        '🚀 *[ATT-Automation]* Chỉ huy sở thông báo: Hệ thống phân phối luồng cảnh báo thông suốt thành công!',
      );
      this.logger.log(
        '✅ [Telegram Connected] LIÊN KẾT TELEGRAM HOÀN TOÀN THÀNH CÔNG!',
      );
    } catch (error) {
      this.logger.error('❌ [Telegram Failed] LIÊN KẾT TELEGRAM THẤT BẠI!');
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        '⚠️ Thiếu cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Huỷ lệnh.',
      );
      return;
    }
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: text,
          parse_mode: 'Markdown',
        },
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Telegram HTTP Error: ${error.response?.data?.description || error.message}`,
      );
      throw error;
    }
  }

  renderSingleAlert(evt: any): string {
    const oldStatus = evt.oldStatus || evt.data?.oldStatus || 'UNKNOWN';
    const newStatus = evt.newStatus || evt.data?.newStatus || 'UNKNOWN';
    const reasonCode = evt.reasonCode || evt.data?.reasonCode || 'SUCCESS';

    const icon = newStatus === 'ALIVE' ? '🟢 HỒI SINH' : '🔴 BÁO TỬ';
    const tabName = evt.variableValues?.tabName || 'Không xác định';
    const portalText = evt.variableValues?.portalText || 'Không xác định';

    let text = `🚨 *[CẢNH BÁO BIẾN ĐỘNG KHẨN CẤP]*\n\n`;
    text += `📡 *Đài mục tiêu:* ${evt.targetSiteCode}\n`;
    text += `💳 *Phương thức:* *${tabName}*\n`;
    text += `🚪 *Cổng:* *${portalText}*\n`;
    text += `${icon}: \`${oldStatus}\` ➔ *${newStatus}*\n`;
    text += `🛠️ *Mã lỗi nghiệp vụ:* \`${reasonCode}\`\n`;
    text += `------------------------------------\n`;
    text += `🕒 *Thời gian:* ${new Date().toLocaleTimeString('vi-VN')}`;
    return text;
  }

  renderAggregatedAlert(clusterKey: string, events: any[]): string {
    let text = `📊 *[BÁO CÁO SỨC KHỎE ĐỊNH KỲ 5 PHÚT]*\n\n`;
    text += `📡 *Đài mục tiêu:* \`${clusterKey}\`\n`;
    text += `📦 *Tổng số lượt kiểm tra:* \`${events.length} ca trực\`\n`;
    text += `------------------------------------\n`;

    const categories = new Map<
      string,
      Map<string, { status: string; count: number }>
    >();

    events.forEach((evt) => {
      const portalText = evt.variableValues?.portalText || 'Cổng Ẩn';
      const tabName = evt.variableValues?.tabName || 'Giao dịch';
      const newStatus = evt.newStatus || evt.data?.newStatus || 'ALIVE';

      const count = evt.checkCount !== undefined ? evt.checkCount : 1;

      if (!categories.has(tabName)) {
        categories.set(tabName, new Map());
      }

      const gatesMap = categories.get(tabName)!;
      if (!gatesMap.has(portalText)) {
        gatesMap.set(portalText, { status: newStatus, count: count });
      } else {
        const exist = gatesMap.get(portalText)!;
        exist.count += count;
        exist.status = newStatus;
      }
    });

    categories.forEach((gatesMap, tabName) => {
      text += `\n💳 *Phương thức: [${tabName.toUpperCase()}]*\n`;

      gatesMap.forEach((info, portalText) => {
        const icon = info.status === 'ALIVE' ? '🟢 ỔN ĐỊNH ' : '🔴 TREO CỔNG';

        text += `  🔹 \`${portalText.padEnd(12, ' ')}\` ➔  ${icon} (Check ${info.count} lần)\n`;
      });
    });

    text += `\n------------------------------------\n`;
    text += `🕒 *Thời gian tổng hợp:* ${new Date().toLocaleTimeString('vi-VN')}`;
    return text;
  }
}
