import { Controller, Post, Body, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { Role } from '@prisma/client'
import { ImportService } from './import.service'
import { ImportCsvDto } from './dto/import.dto'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('Import')
@ApiBearerAuth()
@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('wellness/preview')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Validate a wellness CSV without persisting' })
  async previewWellness(@Body() body: ImportCsvDto) {
    return this.importService.previewWellness(body.csv)
  }

  @Post('wellness')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Import wellness surveys from CSV' })
  async importWellness(
    @Body() body: ImportCsvDto,
    @Query('orgId') orgId: string,
    @Req() req: Request,
  ) {
    return this.importService.importWellness(orgId, body.csv, (req.user as any)?.id)
  }
}
