import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common'
import { createHash } from 'crypto'
import {
  ClearanceStatus,
  ConfidentialityLevel,
  InjuryStatus,
  Prisma,
  Role,
  RtpStage,
  RtpStageStatus,
} from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import {
  AdvanceRtpDto,
  CreateClearanceDto,
  CreateDiagnosisDto,
  CreateTreatmentNoteDto,
  UpdateRtpStageDto,
} from './dto/medical.dto'

// Ordered 5-stage return-to-play continuum.
export const RTP_ORDER: RtpStage[] = [
  RtpStage.REST,
  RtpStage.RECOVERY,
  RtpStage.RECONDITIONING,
  RtpStage.RETURN_TO_TRAINING,
  RtpStage.RETURN_TO_PLAY,
]

// Roles permitted to view/author full clinical data (diagnoses, notes,
// clearance detail). Everyone else gets the segregated coach view.
const CLINICAL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ORGANIZATION_ADMIN,
  Role.MEDICAL_STAFF,
]

export function canViewClinical(role?: Role): boolean {
  return !!role && CLINICAL_ROLES.includes(role)
}

@Injectable()
export class InjuryMedicalService {
  constructor(
    private prisma: PrismaService,
    @Optional() private audit?: AuditService,
  ) {}

  private async getInjuryOrThrow(injuryId: string, orgId: string) {
    const injury = await this.prisma.injury.findFirst({
      where: { id: injuryId, orgId, deletedAt: null },
    })
    if (!injury) throw new NotFoundException('Injury not found')
    return injury
  }

  private assertClinical(role?: Role) {
    if (!canViewClinical(role)) {
      throw new ForbiddenException('Clinical data is restricted to medical staff')
    }
  }

  // ---- Return-to-play stage tracking -------------------------------------

  async getRtpProgress(injuryId: string, orgId: string) {
    await this.getInjuryOrThrow(injuryId, orgId)
    return this.prisma.injuryRtpProgress.findMany({
      where: { injuryId, orgId },
      orderBy: { enteredAt: 'asc' },
    })
  }

  /** Start the RTP pathway at stage REST if it has not begun yet. */
  async initRtp(injuryId: string, orgId: string, userId?: string) {
    await this.getInjuryOrThrow(injuryId, orgId)
    const existing = await this.prisma.injuryRtpProgress.count({ where: { injuryId, orgId } })
    if (existing > 0) {
      throw new BadRequestException('Return-to-play pathway already started')
    }
    const progress = await this.prisma.injuryRtpProgress.create({
      data: { orgId, injuryId, stage: RtpStage.REST, status: RtpStageStatus.IN_PROGRESS },
    })
    await this.prisma.injury.update({
      where: { id: injuryId },
      data: { currentRtpStage: RtpStage.REST, status: InjuryStatus.RECOVERING },
    })
    await this.audit?.log({
      orgId,
      userId,
      action: 'UPDATE',
      entityType: 'injury_rtp_progress',
      entityId: progress.id,
      description: 'Started return-to-play at REST',
      containsMedicalData: true,
    })
    return progress
  }

  /** Update the criteria checklist / notes on the current in-progress stage. */
  async updateCurrentStage(injuryId: string, orgId: string, dto: UpdateRtpStageDto) {
    await this.getInjuryOrThrow(injuryId, orgId)
    const current = await this.prisma.injuryRtpProgress.findFirst({
      where: { injuryId, orgId, status: RtpStageStatus.IN_PROGRESS },
      orderBy: { enteredAt: 'desc' },
    })
    if (!current) throw new BadRequestException('No active return-to-play stage')

    return this.prisma.injuryRtpProgress.update({
      where: { id: current.id },
      data: {
        criteria: (dto.criteria as unknown as Prisma.InputJsonValue) ?? undefined,
        notes: dto.notes ?? undefined,
      },
    })
  }

  /**
   * Advance to the next RTP stage. Gated by:
   *  - every criterion on the current stage being met, and
   *  - an active CLEARED medical clearance before entering RETURN_TO_PLAY.
   */
  async advanceStage(injuryId: string, orgId: string, dto: AdvanceRtpDto, userId?: string) {
    await this.getInjuryOrThrow(injuryId, orgId)
    const current = await this.prisma.injuryRtpProgress.findFirst({
      where: { injuryId, orgId, status: RtpStageStatus.IN_PROGRESS },
      orderBy: { enteredAt: 'desc' },
    })
    if (!current) throw new BadRequestException('No active return-to-play stage to advance')

    // Criteria gating: if a checklist exists, all items must be met.
    const criteria = (current.criteria as unknown as { label: string; met: boolean }[]) ?? []
    if (Array.isArray(criteria) && criteria.length > 0 && criteria.some((c) => !c.met)) {
      throw new BadRequestException('All stage criteria must be met before advancing')
    }

    const currentIdx = RTP_ORDER.indexOf(current.stage)
    if (currentIdx === RTP_ORDER.length - 1) {
      throw new BadRequestException('Athlete is already at the final stage')
    }
    const nextStage = dto.toStage ?? RTP_ORDER[currentIdx + 1]
    if (RTP_ORDER.indexOf(nextStage) !== currentIdx + 1) {
      throw new BadRequestException('Stages must be progressed one at a time')
    }

    // Clearance gating for competition.
    if (nextStage === RtpStage.RETURN_TO_PLAY) {
      const active = await this.getActiveClearance(injuryId, orgId)
      if (!active) {
        throw new ForbiddenException(
          'A valid medical clearance is required before return-to-play',
        )
      }
    }

    await this.prisma.injuryRtpProgress.update({
      where: { id: current.id },
      data: {
        status: RtpStageStatus.COMPLETED,
        completedAt: new Date(),
        clearedBy: userId ?? null,
      },
    })
    const next = await this.prisma.injuryRtpProgress.create({
      data: {
        orgId,
        injuryId,
        stage: nextStage,
        status: RtpStageStatus.IN_PROGRESS,
        notes: dto.notes ?? null,
      },
    })

    await this.prisma.injury.update({
      where: { id: injuryId },
      data: {
        currentRtpStage: nextStage,
        status:
          nextStage === RtpStage.RETURN_TO_PLAY
            ? InjuryStatus.RETURN_TO_PLAY
            : InjuryStatus.RECOVERING,
      },
    })

    await this.audit?.log({
      orgId,
      userId,
      action: 'UPDATE',
      entityType: 'injury_rtp_progress',
      entityId: next.id,
      description: `Advanced RTP ${current.stage} → ${nextStage}`,
      containsMedicalData: true,
    })
    return next
  }

  // ---- Diagnoses (clinical) ----------------------------------------------

  async addDiagnosis(
    injuryId: string,
    orgId: string,
    dto: CreateDiagnosisDto,
    role?: Role,
    userId?: string,
  ) {
    this.assertClinical(role)
    await this.getInjuryOrThrow(injuryId, orgId)
    const diagnosis = await this.prisma.injuryDiagnosis.create({
      data: {
        orgId,
        injuryId,
        icd10Code: dto.icd10Code ?? null,
        description: dto.description,
        confidentiality: dto.confidentiality ?? ConfidentialityLevel.MEDICAL,
        diagnosedBy: userId ?? null,
      },
    })
    await this.audit?.log({
      orgId,
      userId,
      action: 'CREATE',
      entityType: 'injury_diagnosis',
      entityId: diagnosis.id,
      description: `Added diagnosis${dto.icd10Code ? ` (${dto.icd10Code})` : ''}`,
      containsMedicalData: true,
    })
    return diagnosis
  }

  async listDiagnoses(injuryId: string, orgId: string, role?: Role) {
    this.assertClinical(role)
    await this.getInjuryOrThrow(injuryId, orgId)
    return this.prisma.injuryDiagnosis.findMany({
      where: { injuryId, orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async removeDiagnosis(id: string, orgId: string, role?: Role, userId?: string) {
    this.assertClinical(role)
    const existing = await this.prisma.injuryDiagnosis.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Diagnosis not found')
    await this.prisma.injuryDiagnosis.delete({ where: { id } })
    await this.audit?.log({
      orgId,
      userId,
      action: 'DELETE',
      entityType: 'injury_diagnosis',
      entityId: id,
      description: 'Removed diagnosis',
      containsMedicalData: true,
    })
    return { message: 'Diagnosis removed' }
  }

  // ---- Treatment notes (clinical) ----------------------------------------

  async addTreatmentNote(
    injuryId: string,
    orgId: string,
    dto: CreateTreatmentNoteDto,
    role?: Role,
    userId?: string,
  ) {
    this.assertClinical(role)
    await this.getInjuryOrThrow(injuryId, orgId)
    const note = await this.prisma.injuryTreatmentNote.create({
      data: {
        orgId,
        injuryId,
        note: dto.note,
        confidentiality: dto.confidentiality ?? ConfidentialityLevel.MEDICAL,
        medicalHold: dto.medicalHold ?? false,
        authorId: userId ?? null,
      },
    })
    // A note flagged medicalHold pins the injury as clinically held.
    if (dto.medicalHold) {
      await this.prisma.injury.update({ where: { id: injuryId }, data: { medicalHold: true } })
    }
    await this.audit?.log({
      orgId,
      userId,
      action: 'CREATE',
      entityType: 'injury_treatment_note',
      entityId: note.id,
      description: 'Added treatment note',
      containsMedicalData: true,
    })
    return note
  }

  async listTreatmentNotes(injuryId: string, orgId: string, role?: Role) {
    this.assertClinical(role)
    await this.getInjuryOrThrow(injuryId, orgId)
    return this.prisma.injuryTreatmentNote.findMany({
      where: { injuryId, orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ---- Medical clearance --------------------------------------------------

  private async getActiveClearance(injuryId: string, orgId: string) {
    const now = new Date()
    return this.prisma.medicalClearance.findFirst({
      where: {
        injuryId,
        orgId,
        status: ClearanceStatus.CLEARED,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { clearedAt: 'desc' },
    })
  }

  /** Only clinicians may issue clearances; each carries a signature hash. */
  async createClearance(
    injuryId: string,
    orgId: string,
    dto: CreateClearanceDto,
    role?: Role,
    userId?: string,
  ) {
    this.assertClinical(role)
    await this.getInjuryOrThrow(injuryId, orgId)

    const clearedAt = dto.status === ClearanceStatus.CLEARED ? new Date() : null
    const signatureHash = createHash('sha256')
      .update([injuryId, userId ?? 'unknown', dto.status, new Date().toISOString()].join('|'))
      .digest('hex')

    const clearance = await this.prisma.medicalClearance.create({
      data: {
        orgId,
        injuryId,
        status: dto.status,
        restrictions: (dto.restrictions as Prisma.InputJsonValue) ?? undefined,
        clearedBy: userId ?? null,
        clearedAt,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        signatureHash,
        notes: dto.notes ?? null,
      },
    })
    await this.audit?.log({
      orgId,
      userId,
      action: 'CREATE',
      entityType: 'medical_clearance',
      entityId: clearance.id,
      description: `Medical clearance recorded: ${dto.status}`,
      containsMedicalData: true,
    })
    return clearance
  }

  async listClearances(injuryId: string, orgId: string, role?: Role) {
    this.assertClinical(role)
    await this.getInjuryOrThrow(injuryId, orgId)
    return this.prisma.medicalClearance.findMany({
      where: { injuryId, orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ---- Role-segregated case detail ---------------------------------------

  /**
   * Coaches and non-clinical staff see case existence, RTP stage and progress
   * only. Clinical roles additionally receive diagnoses, notes and clearances.
   */
  async getCaseDetail(id: string, orgId: string, role?: Role) {
    const injury = await this.prisma.injury.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
    })
    if (!injury) throw new NotFoundException('Injury not found')

    const rtpProgress = await this.prisma.injuryRtpProgress.findMany({
      where: { injuryId: id, orgId },
      orderBy: { enteredAt: 'asc' },
    })

    const base = {
      id: injury.id,
      athlete: injury.athlete,
      bodyPart: injury.bodyPart,
      status: injury.status,
      severity: injury.severity,
      currentRtpStage: injury.currentRtpStage,
      medicalHold: injury.medicalHold,
      onsetDate: injury.onsetDate,
      expectedReturnDate: injury.expectedReturnDate,
      rtpProgress: rtpProgress.map((p) => ({
        stage: p.stage,
        status: p.status,
        enteredAt: p.enteredAt,
        completedAt: p.completedAt,
        // criteria/notes withheld from the coach view
      })),
    }

    if (!canViewClinical(role)) {
      return { ...base, clinicalAccess: false }
    }

    const [diagnoses, treatmentNotes, clearances] = await Promise.all([
      this.prisma.injuryDiagnosis.findMany({ where: { injuryId: id, orgId } }),
      this.prisma.injuryTreatmentNote.findMany({ where: { injuryId: id, orgId } }),
      this.prisma.medicalClearance.findMany({ where: { injuryId: id, orgId } }),
    ])

    return {
      ...base,
      clinicalAccess: true,
      rtpProgress, // full detail incl. criteria for clinicians
      diagnoses,
      treatmentNotes,
      clearances,
    }
  }
}
