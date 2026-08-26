import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';

const ALLOWED_TABLES = [
  'patients',
  'appointments',
  'users',
  'organizations',
  'tenants',
  'organization_members',
  'profiles',
  'roles',
  'permissions',
  'audit_events',
  'documents',
  'fhir_resources',
  'nhif_claims',
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

@Injectable()
export class SupabaseService {
  private client: SupabaseClient | null;

  constructor(private supabaseConfig: SupabaseConfig) {
    this.client = supabaseConfig.getClient() ?? null;
  }

  private ensureClient(): SupabaseClient {
    if (!this.client) {
      throw new InternalServerErrorException('Supabase client is not configured.');
    }

    return this.client;
  }

  private validateTable(table: string): AllowedTable {
    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      throw new BadRequestException(`Table '${table}' is not allowed for proxy access.`);
    }

    return table as AllowedTable;
  }

  private handleError(error: PostgrestError | null): void {
    if (!error) return;
    if (error.message?.toLowerCase().includes('no rows')) {
      throw new NotFoundException(error.message);
    }
    throw new InternalServerErrorException(error.message);
  }

  async getHealth() {
    const client = this.ensureClient();
    try {
      const { data, error } = await client.from('organizations').select('id').limit(1);
      if (error) {
        return {
          configured: true,
          connected: false,
          message: `Supabase connection failed: ${error.message}`,
        };
      }

      return {
        configured: true,
        connected: true,
        message: 'Supabase is reachable through the backend proxy.',
      };
    } catch (error) {
      return {
        configured: true,
        connected: false,
        message: error instanceof Error ? error.message : 'Unknown Supabase health error.',
      };
    }
  }

  async fetchTable(table: string, options?: { limit?: number; orderBy?: string; ascending?: boolean }) {
    const client = this.ensureClient();
    const validatedTable = this.validateTable(table);

    let query = client.from(validatedTable).select('*');
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) this.handleError(error);
    return data ?? [];
  }

  async fetchRow(table: string, id: string, expand?: string) {
    const client = this.ensureClient();
    const validatedTable = this.validateTable(table);

    let query = client.from(validatedTable).select('*').eq('id', id).single();
    if (validatedTable === 'patients' && expand === 'appointments') {
      query = client.from('patients').select('*, appointments(*)').eq('id', id).single();
    }

    const { data, error } = await query;
    if (error) this.handleError(error);
    return data ?? null;
  }

  async createRow(table: string, payload: Record<string, unknown>) {
    const client = this.ensureClient();
    const validatedTable = this.validateTable(table);

    const { data, error } = await client.from(validatedTable).insert(payload).select().single();
    if (error) this.handleError(error);
    return data;
  }

  async updateRow(table: string, id: string, payload: Record<string, unknown>) {
    const client = this.ensureClient();
    const validatedTable = this.validateTable(table);

    const { data, error } = await client.from(validatedTable).update(payload).eq('id', id).select().single();
    if (error) this.handleError(error);
    return data;
  }

  async deleteRow(table: string, id: string) {
    const client = this.ensureClient();
    const validatedTable = this.validateTable(table);

    const { error } = await client.from(validatedTable).delete().eq('id', id);
    if (error) this.handleError(error);
    return { deleted: true };
  }
}
