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
        '🚀 *[ATT-Automation]* Thử nghiệm hỏa tốc: Tháp chỉ huy Gateway đã liên kết và thông suốt thành công với Telegram Group!',
      );
      this.logger.log(
        '✅ [Telegram Connected] LIÊN KẾT TELEGRAM HOÀN TOÀN THÀNH CÔNG!',
      );
    } catch (error) {
      this.logger.error(
        '❌ [Telegram Failed] LIÊN KẾT TELEGRAM THẤT BẠI! Vui lòng kiểm tra lại log lỗi bên dưới.',
      );
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        '⚠️ Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong .env. Huỷ lệnh.',
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
    const icon = evt.data.newStatus === 'ALIVE' ? '🟢' : '🔴';

    const tabName = evt.variableValues?.tabName || 'Không xác định';
    const portalText = evt.variableValues?.portalText || 'Không xác định';

    let text = `🚨 *[CẢNH BÁO BIẾN ĐỘNG KHẨN CẤP]*\n\n`;
    text += `📡 *Đài mục tiêu:* ${evt.targetSiteCode}\n`;
    text += `💳 *Phương thức:* *${tabName}*\n`;
    text += `🚪 *Cổng:* *${portalText}*\n`;
    text += `${icon} *Trạng thái mới:* ${evt.data.newStatus}\n`;
    text += `🛠️ *Mã lỗi nghiệp vụ:* \`${evt.data.reasonCode}\`\n`;
    text += `------------------------------------\n`;
    text += `🕒 *Thời gian:* ${new Date(evt.timestamp).toLocaleTimeString('vi-VN')}`;
    return text;
  }

  renderAggregatedAlert(clusterKey: string, events: any[]): string {
    let text = `⚠️ *[CẢNH BÁO BIẾN ĐỘNG HỆ THỐNG]*\n\n`;
    text += `📡 *Đài mục tiêu:* ${clusterKey}\n`;
    text += `🚨 *Số lượng cổng ghi nhận:* ${events.length}\n`;
    text += `------------------------------------\n`;

    events.forEach((evt, idx) => {
      const icon = evt.data.newStatus === 'ALIVE' ? '🟢 HỒI SINH' : '🔴 BÁO TỬ';
      text += `${idx + 1}. Bot \`${evt.taskId}\` ➔ ${icon}\n`;
      text += `    ↳ Lý do: \`${evt.data.reasonCode}\`\n`;
    });

    text += `\n🕒 *Thời gian tổng hợp:* ${new Date().toLocaleTimeString('vi-VN')}`;
    return text;
  }
}
