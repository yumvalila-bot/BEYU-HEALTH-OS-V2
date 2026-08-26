import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseConfig {
  private supabase;

  constructor(private configService: ConfigService) {
    const url = this.configService.get('SUPABASE_URL');
    const key = this.configService.get('SUPABASE_SERVICE_KEY');
    
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  getClient() {
    return this.supabase;
  }

  getUrl(): string {
    return this.configService.get('SUPABASE_URL');
  }

  getServiceKey(): string {
    return this.configService.get('SUPABASE_SERVICE_KEY');
  }
}
