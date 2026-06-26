// src/modules/result/result.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

export interface EvaluationResult {
  hasChanged: boolean;
  oldStatus: string;
  newStatus: string;
  reasonCode: string;
}

@Injectable()
export class ResultService {
  private readonly logger = new Logger(ResultService.name);

  constructor(private readonly redisService: RedisService) {}

  async evaluateResult(payload: any): Promise<EvaluationResult> {
    const slug = payload.templateSlug;

    this.logger.log(
      `🔍 [Evaluation Engine] Đang bốc chiến lược xử lý cho kịch bản: [${slug}]`,
    );

    if (slug === 'momo-pay-da-tab-by-admin' || slug.includes('portal-check')) {
      return await this.evaluateMomoPortalCheck(payload);
    }

    if (slug === 'bank-balance-api-check') {
      return await this.evaluateBankApiCheck(payload);
    }

    return {
      hasChanged: false,
      oldStatus: 'UNKNOWN',
      newStatus: payload.result.status,
      reasonCode: payload.result.reasonCode,
    };
  }

  private async evaluateMomoPortalCheck(
    payload: any,
  ): Promise<EvaluationResult> {
    const redisKey = `site:portals:status:${payload.targetSiteCode}`;
    const field = payload.taskId;
    const newStatus = payload.result.status;

    const rawOldStatus = await this.redisService
      .getClient()
      .hget(redisKey, field);

    let oldStatus = 'UNKNOWN';
    if (rawOldStatus) {
      try {
        const parsed = JSON.parse(rawOldStatus);
        oldStatus = parsed.status || 'UNKNOWN';
      } catch {
        oldStatus = rawOldStatus;
      }
    }

    const portalState = {
      status: newStatus,
      tabName: payload.variableValues?.tabName || 'Giao dịch',
      portalText: payload.variableValues?.portalText || 'Cổng Ẩn',
      reasonCode: payload.result.reasonCode,
      timestamp: Date.now(),
    };

    await this.redisService
      .getClient()
      .hset(redisKey, field, JSON.stringify(portalState));

    const hasChanged = oldStatus !== newStatus;

    return {
      hasChanged,
      oldStatus,
      newStatus,
      reasonCode: payload.result.reasonCode,
    };
  }

  private async evaluateBankApiCheck(payload: any): Promise<EvaluationResult> {
    this.logger.debug(
      'Kịch bản xử lý so khớp số dư dòng tiền API chưa kích hoạt.',
    );
    return {
      hasChanged: false,
      oldStatus: 'UNKNOWN',
      newStatus: payload.result.status,
      reasonCode: payload.result.reasonCode,
    };
  }
}
