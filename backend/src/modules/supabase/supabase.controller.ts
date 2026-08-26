import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseService } from './supabase.service';

@ApiTags('supabase')
@Controller('api/supabase')
export class SupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Supabase proxy health' })
  async health() {
    return this.supabaseService.getHealth();
  }

  @Get(':table')
  @ApiOperation({ summary: 'Fetch rows from a Supabase table via backend proxy' })
  async fetchTable(
    @Param('table') table: string,
    @Query('limit') limit?: string,
    @Query('orderBy') orderBy?: string,
    @Query('ascending') ascending?: string,
  ) {
    return this.supabaseService.fetchTable(table, {
      limit: limit ? Number(limit) : undefined,
      orderBy,
      ascending: ascending === 'true',
    });
  }

  @Get(':table/:id')
  @ApiOperation({ summary: 'Fetch a row by ID from a Supabase table via backend proxy' })
  async fetchRow(
    @Param('table') table: string,
    @Param('id') id: string,
    @Query('expand') expand?: string,
  ) {
    return this.supabaseService.fetchRow(table, id, expand);
  }

  @Post(':table')
  @ApiOperation({ summary: 'Create a row in a Supabase table via backend proxy' })
  async createRow(@Param('table') table: string, @Body() payload: Record<string, unknown>) {
    return this.supabaseService.createRow(table, payload);
  }

  @Put(':table/:id')
  @ApiOperation({ summary: 'Update a row in a Supabase table via backend proxy' })
  async updateRow(@Param('table') table: string, @Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.supabaseService.updateRow(table, id, payload);
  }

  @Delete(':table/:id')
  @ApiOperation({ summary: 'Delete a row from a Supabase table via backend proxy' })
  async deleteRow(@Param('table') table: string, @Param('id') id: string) {
    return this.supabaseService.deleteRow(table, id);
  }
}
