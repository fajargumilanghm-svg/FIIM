import { Global, Module } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'

// Global so any producer can log via optional injection without importing this.
@Global()
@Module({
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
