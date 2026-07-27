import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

import configuration from './config/configuration'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { AthletesModule } from './modules/athletes/athletes.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { WellnessModule } from './modules/wellness/wellness.module'
import { TrainingLoadModule } from './modules/training-load/training-load.module'
import { CalculationsModule } from './modules/calculations/calculations.module'
import { AlertsModule } from './modules/alerts/alerts.module'
import { InjuriesModule } from './modules/injuries/injuries.module'

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { RolesGuard } from './common/guards/roles.guard'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    PrismaModule,

    // Feature Modules - Sprint 1
    AuthModule,
    UsersModule,
    AthletesModule,
    // Feature Modules - Sprint 2
    DashboardModule,
    // Feature Modules - Sprint 3
    WellnessModule,
    TrainingLoadModule,
    // Feature Modules - Sprint 4
    CalculationsModule,
    AlertsModule,
    InjuriesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
