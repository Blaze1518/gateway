import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

export interface ProtectedAccount {
  username: string;
  siteCode: string;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  private readonly MAX_TOKENS = 3;
  private readonly REFILL_INTERVAL_MS = 10000;

  constructor(private readonly redisService: RedisService) {}
}
