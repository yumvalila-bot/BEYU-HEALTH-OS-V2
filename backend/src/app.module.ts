import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';

// Configuration
import databaseConfig from './config/database.config';
import { SupabaseConfig } from './config/supabase.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { IdentityModule } from './modules/identity/identity.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ClinicalModule } from './modules/clinical/clinical.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { SearchModule } from './modules/search/search.module';
import { FhirModule } from './modules/fhir/fhir.module';
import { AiModule } from './modules/ai/ai.module';
import { IntegrationModule } from './modules/integrations/integrations.module';
import { SupabaseModule } from './modules/supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      expandVariables: true,
    }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: ['src/**/*.entity.ts'],
        migrations: ['src/database/migrations/*.ts'],
        subscribers: ['src/database/subscribers/*.ts'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('DB_LOGGING', false),
      }),
      inject: [ConfigService],
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: true,
        playground: configService.get('NODE_ENV') === 'development',
        context: ({ req }) => ({ req }),
      }),
      inject: [ConfigService],
    }),

    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
      max: 100,
    }),

    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // Core Modules
    HealthModule,
    AuthModule,
    IdentityModule,
    TenantsModule,

    // Domain Modules
    PatientsModule,
    ClinicalModule,
    AppointmentsModule,
    LaboratoryModule,
    PharmacyModule,
    BillingModule,

    // Cross-cutting Modules
    NotificationsModule,
    AuditModule,
    SearchModule,
    FhirModule,
    AiModule,
    IntegrationModule,
    SupabaseModule,
  ],
  providers: [SupabaseConfig],
})
export class AppModule {}
