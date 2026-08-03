import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { AlertQueryDto } from '../alerts/dto/alerts.dto'
import { InjuryQueryDto } from '../injuries/dto/injuries.dto'
import { AuditQueryDto } from '../audit/dto/audit.dto'

/**
 * Regression guard for a bug found during e2e verification: list controllers
 * bind the whole query string to a DTO while `orgId` is passed as a sibling
 * query param. Under the global ValidationPipe (whitelist + forbidNonWhitelisted)
 * a DTO without `orgId` makes every request 400 "property orgId should not exist".
 * These DTOs must therefore declare `orgId`.
 */
const PIPE_OPTS = { whitelist: true, forbidNonWhitelisted: true } as const

describe('list query DTOs allow orgId alongside filters', () => {
  it('AlertQueryDto accepts orgId + status', async () => {
    const dto = plainToInstance(AlertQueryDto, { orgId: 'org', status: 'OPEN' })
    expect(await validate(dto, PIPE_OPTS)).toHaveLength(0)
  })

  it('InjuryQueryDto accepts orgId + status', async () => {
    const dto = plainToInstance(InjuryQueryDto, { orgId: 'org', status: 'RESOLVED' })
    expect(await validate(dto, PIPE_OPTS)).toHaveLength(0)
  })

  it('AuditQueryDto accepts orgId + action', async () => {
    const dto = plainToInstance(AuditQueryDto, { orgId: 'org', action: 'CREATE' })
    expect(await validate(dto, PIPE_OPTS)).toHaveLength(0)
  })

  it('still rejects genuinely unknown properties', async () => {
    const dto = plainToInstance(AlertQueryDto, { orgId: 'org', bogus: 'x' })
    expect((await validate(dto, PIPE_OPTS)).length).toBeGreaterThan(0)
  })
})
