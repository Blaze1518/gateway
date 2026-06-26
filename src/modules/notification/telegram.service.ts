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

  /**
   * 🚨 BIẾN ĐỘNG LẬP TỨC: Hiển thị hỏa tốc bước nhảy trạng thái
   */
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

  /**
   * ⚠️ BÁO CÁO ĐỊNH KỲ 5 PHÚT: Gom tụ gọn gàng toàn bộ nhịp tim ổn định theo Tên Cổng
   */
  renderAggregatedAlert(clusterKey: string, events: any[]): string {
    let text = `📊 *[BÁO CÁO SỨC KHỎE ĐỊNH KỲ 5 PHÚT]*\n\n`;
    text += `📡 *Đài mục tiêu:* ${clusterKey}\n`;
    text += `📦 *Tổng số lượt kiểm tra an toàn:* ${events.length} ca trực\n`;
    text += `------------------------------------\n`;

    // Khai báo khay chứa cấu trúc Map để triệt tiêu việc lặp cổng nạp trùng lặp
    const uniqueGates = new Map<
      string,
      { tabName: string; status: string; count: number }
    >();

    events.forEach((evt) => {
      const portalText = evt.variableValues?.portalText || 'Cổng Ẩn';
      const tabName = evt.variableValues?.tabName || 'Giao dịch';
      const newStatus = evt.newStatus || evt.data?.newStatus || 'ALIVE';

      const gateKey = `${tabName}-${portalText}`;
      if (!uniqueGates.has(gateKey)) {
        uniqueGates.set(gateKey, { tabName, status: newStatus, count: 1 });
      } else {
        const exist = uniqueGates.get(gateKey)!;
        exist.count += 1;
        exist.status = newStatus; // Lưu trạng thái mốc cuối chu kỳ
      }
    });

    // In danh sách các cổng nạp đã được tinh chế sạch sẽ
    let idx = 1;
    uniqueGates.forEach((info, gateKey) => {
      const [tabName, portalText] = gateKey.split('-');
      const icon = info.status === 'ALIVE' ? '🟢 ỔN ĐỊNH' : '🔴 TREO CỔNG';
      text += `${idx}. *[${tabName}]* ${portalText} ➔ ${icon} (Đã check ${info.count} lần)\n`;
      idx++;
    });

    text += `\n🕒 *Thời gian tổng hợp:* ${new Date().toLocaleTimeString('vi-VN')}`;
    return text;
  }
}
