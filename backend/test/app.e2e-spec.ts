import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

/**
 * Bootstrap-level e2e. PrismaService is overridden with a stub so the app can
 * start without a live database — this exercises versioning, the validation
 * pipe, and the global auth guard end-to-end. Data-backed e2e specs should run
 * against a real test database via `npm run test:e2e`.
 */
describe('App bootstrap (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn(), $connect: jest.fn(), $disconnect: jest.fn() })
      .compile()

    app = moduleRef.createNestApplication()
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' })
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('returns 404 for an unknown route', () => {
    return request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404)
  })

  it('rejects a protected route without a bearer token (401)', () => {
    return request(app.getHttpServer()).get('/api/v1/alerts?orgId=org-1').expect(401)
  })
})
