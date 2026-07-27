import { PrismaClient, Role, Gender, AthleteStatus, SportType, PositionCategory, MFAStatus } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (order matters for FK constraints)
  await prisma.auditLog.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.position.deleteMany()
  await prisma.sport.deleteMany()
  await prisma.athlete.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.oAuthAccount.deleteMany()
  await prisma.userOrganization.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  console.log('Cleaned existing data')

  // ==========================================================================
  // 1. Organization
  // ==========================================================================
  const org = await prisma.organization.create({
    data: {
      name: 'Elite Sports Academy',
      slug: 'elite-sports',
      description: 'Premier multi-sport training facility',
      country: 'US',
      timezone: 'America/New_York',
      contactEmail: 'admin@elitesports.local',
      features: {
        enableWellness: true,
        enableTrainingLoad: true,
        enableInjuryManagement: true,
        enableAlerts: true,
        enableReporting: true,
      },
    },
  })
  console.log(`✅ Created organization: ${org.name}`)

  // ==========================================================================
  // 2. Users
  // ==========================================================================
  const passwordHash = await argon2.hash('password123')

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@fiim.local',
      password: passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'Super Admin',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  })

  const coach = await prisma.user.create({
    data: {
      email: 'coach@elitesports.local',
      password: passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      displayName: 'Coach Sarah',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  })

  const medicalStaff = await prisma.user.create({
    data: {
      email: 'medical@elitesports.local',
      password: passwordHash,
      firstName: 'Dr. James',
      lastName: 'Wilson',
      displayName: 'Dr. Wilson',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log(`✅ Created ${3} users`)

  // ==========================================================================
  // 3. User-Organization Links
  // ==========================================================================
  await prisma.userOrganization.createMany({
    data: [
      { userId: superAdmin.id, orgId: org.id, role: Role.SUPER_ADMIN, isPrimary: true },
      { userId: coach.id, orgId: org.id, role: Role.COACH, isPrimary: true },
      { userId: medicalStaff.id, orgId: org.id, role: Role.MEDICAL_STAFF, isPrimary: true },
    ],
  })
  console.log('✅ Created user-organization links')

  // ==========================================================================
  // 4. Sports & Positions
  // ==========================================================================
  const soccer = await prisma.sport.create({
    data: {
      orgId: org.id,
      name: 'Soccer',
      type: SportType.SOCCER,
      description: 'Association football',
    },
  })

  const basketball = await prisma.sport.create({
    data: {
      orgId: org.id,
      name: 'Basketball',
      type: SportType.BASKETBALL,
      description: 'Professional basketball program',
    },
  })

  const soccerPositions = [
    { name: 'Goalkeeper', abbreviation: 'GK', category: PositionCategory.GOALKEEPER },
    { name: 'Center Back', abbreviation: 'CB', category: PositionCategory.DEFENSE },
    { name: 'Full Back', abbreviation: 'FB', category: PositionCategory.DEFENSE },
    { name: 'Defensive Midfielder', abbreviation: 'CDM', category: PositionCategory.MIDFIELD },
    { name: 'Central Midfielder', abbreviation: 'CM', category: PositionCategory.MIDFIELD },
    { name: 'Attacking Midfielder', abbreviation: 'CAM', category: PositionCategory.MIDFIELD },
    { name: 'Winger', abbreviation: 'WG', category: PositionCategory.FORWARD },
    { name: 'Striker', abbreviation: 'ST', category: PositionCategory.FORWARD },
  ]

  for (const pos of soccerPositions) {
    await prisma.position.create({
      data: { sportId: soccer.id, ...pos },
    })
  }

  const basketballPositions = [
    { name: 'Point Guard', abbreviation: 'PG', category: PositionCategory.GENERAL },
    { name: 'Shooting Guard', abbreviation: 'SG', category: PositionCategory.GENERAL },
    { name: 'Small Forward', abbreviation: 'SF', category: PositionCategory.GENERAL },
    { name: 'Power Forward', abbreviation: 'PF', category: PositionCategory.GENERAL },
    { name: 'Center', abbreviation: 'C', category: PositionCategory.GENERAL },
  ]

  for (const pos of basketballPositions) {
    await prisma.position.create({
      data: { sportId: basketball.id, ...pos },
    })
  }

  console.log(`✅ Created 2 sports with ${soccerPositions.length + basketballPositions.length} positions`)

  // ==========================================================================
  // 5. Teams
  // ==========================================================================
  const seniorTeam = await prisma.team.create({
    data: {
      orgId: org.id,
      sportId: soccer.id,
      name: 'Senior Squad',
      category: 'Senior',
    },
  })

  const u18Team = await prisma.team.create({
    data: {
      orgId: org.id,
      sportId: soccer.id,
      name: 'U18 Development',
      category: 'U18',
    },
  })

  console.log('✅ Created 2 teams')

  // ==========================================================================
  // 6. Athletes
  // ==========================================================================
  const positions = await prisma.position.findMany({ where: { sportId: soccer.id } })
  const getPosition = (name: string) => positions.find(p => p.name === name)?.id

  const athletes = [
    {
      firstName: 'Marcus', lastName: 'Rodriguez', email: 'marcus.r@elitesports.local',
      dateOfBirth: new Date('1998-03-15'), gender: Gender.MALE, nationality: 'ES',
      heightCm: 185, weightKg: 78, jerseyNumber: 10,
      sportId: soccer.id, positionId: getPosition('Attacking Midfielder'),
      status: AthleteStatus.ACTIVE,
      emergencyContactName: 'Maria Rodriguez', emergencyContactPhone: '+1-555-0101',
      emergencyContactRelation: 'Mother',
    },
    {
      firstName: 'James', lastName: 'Thompson', email: 'james.t@elitesports.local',
      dateOfBirth: new Date('2000-07-22'), gender: Gender.MALE, nationality: 'US',
      heightCm: 192, weightKg: 85, jerseyNumber: 1,
      sportId: soccer.id, positionId: getPosition('Goalkeeper'),
      status: AthleteStatus.ACTIVE,
      emergencyContactName: 'Lisa Thompson', emergencyContactPhone: '+1-555-0102',
      emergencyContactRelation: 'Mother',
    },
    {
      firstName: 'Chen', lastName: 'Wei', email: 'chen.w@elitesports.local',
      dateOfBirth: new Date('1999-11-08'), gender: Gender.MALE, nationality: 'CN',
      heightCm: 175, weightKg: 68, jerseyNumber: 8,
      sportId: soccer.id, positionId: getPosition('Central Midfielder'),
      status: AthleteStatus.ACTIVE,
      emergencyContactName: 'Li Wei', emergencyContactPhone: '+1-555-0103',
      emergencyContactRelation: 'Father',
    },
    {
      firstName: 'Emma', lastName: 'Andersson', email: 'emma.a@elitesports.local',
      dateOfBirth: new Date('2001-01-30'), gender: Gender.FEMALE, nationality: 'SE',
      heightCm: 168, weightKg: 58, jerseyNumber: 9,
      sportId: soccer.id, positionId: getPosition('Striker'),
      status: AthleteStatus.INJURED, injuryStatus: 'ACL Tear - Right Knee',
      returnToPlayDate: new Date('2024-06-01'),
      emergencyContactName: 'Lars Andersson', emergencyContactPhone: '+1-555-0104',
      emergencyContactRelation: 'Father',
    },
    {
      firstName: 'Diego', lastName: 'Martinez', email: 'diego.m@elitesports.local',
      dateOfBirth: new Date('1997-05-12'), gender: Gender.MALE, nationality: 'AR',
      heightCm: 180, weightKg: 72, jerseyNumber: 7,
      sportId: soccer.id, positionId: getPosition('Winger'),
      status: AthleteStatus.ACTIVE,
      emergencyContactName: 'Carla Martinez', emergencyContactPhone: '+1-555-0105',
      emergencyContactRelation: 'Mother',
    },
    {
      firstName: 'Olivia', lastName: 'Johnson', email: 'olivia.j@elitesports.local',
      dateOfBirth: new Date('2003-09-18'), gender: Gender.FEMALE, nationality: 'US',
      heightCm: 165, weightKg: 55, jerseyNumber: 3,
      sportId: soccer.id, positionId: getPosition('Full Back'),
      status: AthleteStatus.ACTIVE,
      emergencyContactName: 'Robert Johnson', emergencyContactPhone: '+1-555-0106',
      emergencyContactRelation: 'Father',
    },
  ]

  for (const athleteData of athletes) {
    const athlete = await prisma.athlete.create({
      data: {
        orgId: org.id,
        ...athleteData,
      },
    })

    // Add to team
    await prisma.teamMember.create({
      data: {
        teamId: seniorTeam.id,
        athleteId: athlete.id,
        role: athleteData.jerseyNumber === 1 ? 'PLAYER' : 'PLAYER',
      },
    })
  }

  console.log(`✅ Created ${athletes.length} athletes`)

  // ==========================================================================
  // 7. Audit Log Seed
  // ==========================================================================
  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      userId: superAdmin.id,
      action: 'CREATE',
      entityType: 'organization',
      entityId: org.id,
      description: 'Organization created during seed',
    },
  })

  // ==========================================================================
  // 8. Training Sessions & Athlete Loads (for ACWR demo data)
  // ==========================================================================
  const allAthletes = await prisma.athlete.findMany({ where: { orgId: org.id } })
  const today = new Date('2026-07-09')

  // Generate 28 days of training history
  for (let dayOffset = -27; dayOffset <= 0; dayOffset++) {
    const sessionDate = new Date(today)
    sessionDate.setDate(sessionDate.getDate() + dayOffset)
    const dateStr = sessionDate.toISOString().split('T')[0]

    // Skip some days (rest days) for realism
    if (dayOffset % 7 === 0) continue // Sunday rest

    // Morning session
    const morningSession = await prisma.trainingSession.create({
      data: {
        orgId: org.id,
        name: `Morning Training ${dateStr}`,
        description: 'Technical drills and conditioning',
        scheduledDate: sessionDate,
        sessionType: 'TRAINING',
        durationMinutes: 90,
        plannedRpe: 6,
        location: 'Main Field',
        status: 'COMPLETED',
      },
    })

    // Afternoon session (MWF)
    let afternoonSession
    if ([1, 3, 5].includes(dayOffset % 7)) {
      afternoonSession = await prisma.trainingSession.create({
        data: {
          orgId: org.id,
          name: `Afternoon Session ${dateStr}`,
          description: 'Tactical work and small-sided games',
          scheduledDate: sessionDate,
          sessionType: 'TRAINING',
          durationMinutes: 75,
          plannedRpe: 8,
          location: 'Training Ground B',
          status: 'COMPLETED',
        },
      })
    }

      // Assign loads to each athlete with variation
    for (const athlete of allAthletes) {
      if (athlete.status === 'INJURED' && Math.random() > 0.3) continue // Injured athletes skip 70%

      const rpeVariation = Math.floor(Math.random() * 3) - 1 // -1, 0, or +1
      const durationVariation = Math.floor(Math.random() * 10) - 5
      const baseRpe = (morningSession.plannedRpe || 6) + rpeVariation
      const baseDuration = (morningSession.durationMinutes || 90) + durationVariation
      const totalLoad = baseRpe * baseDuration

      await prisma.athleteSessionLoad.create({
        data: {
          sessionId: morningSession.id,
          athleteId: athlete.id,
          orgId: org.id,
          rpeScore: baseRpe,
          durationMinutes: baseDuration,
          totalLoad,
          distanceMeters: 3000 + Math.floor(Math.random() * 2000),
          accelerations: 15 + Math.floor(Math.random() * 20),
          decelerations: 12 + Math.floor(Math.random() * 15),
          heartRateAvg: 140 + Math.floor(Math.random() * 20),
          heartRateMax: 175 + Math.floor(Math.random() * 15),
        },
      })

      // Afternoon session loads
      if (afternoonSession) {
        const pmRpeVariation = Math.floor(Math.random() * 3) - 1
        const pmDurationVariation = Math.floor(Math.random() * 10) - 5
        const pmBaseRpe = (afternoonSession.plannedRpe || 8) + pmRpeVariation
        const pmBaseDuration = (afternoonSession.durationMinutes || 75) + pmDurationVariation
        const pmTotalLoad = pmBaseRpe * pmBaseDuration

        await prisma.athleteSessionLoad.create({
          data: {
            sessionId: afternoonSession.id,
            athleteId: athlete.id,
            orgId: org.id,
            rpeScore: pmBaseRpe,
            durationMinutes: pmBaseDuration,
            totalLoad: pmTotalLoad,
            distanceMeters: 2000 + Math.floor(Math.random() * 1500),
            accelerations: 20 + Math.floor(Math.random() * 25),
            decelerations: 18 + Math.floor(Math.random() * 20),
            heartRateAvg: 150 + Math.floor(Math.random() * 20),
            heartRateMax: 180 + Math.floor(Math.random() * 12),
          },
        })
      }
    }
  }

  console.log('✅ Created training sessions and athlete loads')

  // ==========================================================================
  // 9. Wellness Surveys (last 14 days)
  // ==========================================================================
  for (const athlete of allAthletes) {
    if (athlete.status === 'INJURED') continue
    for (let dayOffset = -13; dayOffset <= 0; dayOffset++) {
      const surveyDate = new Date(today)
      surveyDate.setDate(surveyDate.getDate() + dayOffset)

      // Random wellness metrics (1-10 scale)
      const sleepQuality = 5 + Math.floor(Math.random() * 5)
      const sleepHours = 6 + Math.floor(Math.random() * 3)
      const fatigueLevel = 3 + Math.floor(Math.random() * 5)
      const mood = 5 + Math.floor(Math.random() * 5)
      const stressLevel = 3 + Math.floor(Math.random() * 5)
      const muscleSoreness = 3 + Math.floor(Math.random() * 5)
      const hydration = 6 + Math.floor(Math.random() * 4)

      // Wellness score formula (from backend)
      const wellnessScore = Math.round(
        (sleepQuality + sleepHours * 1.5 + (10 - fatigueLevel) + mood + (10 - stressLevel) + (10 - muscleSoreness) + hydration) / 7
      )

      await prisma.wellnessSurvey.create({
        data: {
          orgId: org.id,
          athleteId: athlete.id,
          surveyDate,
          sleepQuality,
          sleepHours,
          fatigueLevel,
          mood,
          stressLevel,
          muscleSoreness,
          hydration,
          submittedById: coach.id,
          wellnessScore,
        },
      })
    }
  }

  console.log('✅ Created wellness surveys')

  console.log('\n🎉 Seed completed successfully!')
  console.log(`\nTest Accounts:`)
  console.log(`  Super Admin: superadmin@fiim.local / password123`)
  console.log(`  Coach:       coach@elitesports.local / password123`)
  console.log(`  Medical:     medical@elitesports.local / password123`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
