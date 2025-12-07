import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

export async function GET(request: Request) {
  try {
    // @ts-expect-error - getServerSession type inference issue
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ message: 'Patient ID is required' }, { status: 400 })
    }

    // Find the patient by patientId
    const patient = await prisma.patient.findUnique({
      where: { patientId }
    })

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 })
    }

    // Fetch all tests for this patient
    const tests = await prisma.patientTest.findMany({
      where: {
        patientId: patient.id
      },
      orderBy: {
        sampleDate: 'desc'
      }
    })

    return NextResponse.json({ tests }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching patient test data:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch patient test data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // @ts-expect-error - getServerSession type inference issue
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { patientId, sampleDate, ...testData } = body

    if (!patientId) {
      return NextResponse.json({ message: 'Patient ID is required' }, { status: 400 })
    }

    // Find the patient by patientId
    const patient = await prisma.patient.findUnique({
      where: { patientId }
    })

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 })
    }

    // Parse the test data - each section has { data, date } structure
    const parsedTestData: any = {}
    
    // Extract data from each test section
    if (testData.autoimmunoProfile) {
      parsedTestData.autoimmunoProfile = testData.autoimmunoProfile.data || testData.autoimmunoProfile
    }
    if (testData.cardiology) {
      parsedTestData.cardiology = testData.cardiology.data || testData.cardiology
    }
    if (testData.rft) {
      parsedTestData.rft = testData.rft.data || testData.rft
    }
    if (testData.lft) {
      parsedTestData.lft = testData.lft.data || testData.lft
    }
    if (testData.diseaseHistory) {
      parsedTestData.diseaseHistory = testData.diseaseHistory.data || testData.diseaseHistory
    }
    if (testData.imaging) {
      parsedTestData.imaging = testData.imaging.data || testData.imaging
    }
    if (testData.hematology) {
      parsedTestData.hematology = testData.hematology.data || testData.hematology
    }

    // Use sampleDate from testData or body, default to now
    const reportDate = testData.sampleDate || sampleDate || new Date().toISOString()

    // Store test data in database
    const savedTest = await prisma.patientTest.create({
      data: {
        patientId: patient.id,
        sampleDate: new Date(reportDate),
        autoimmunoProfile: parsedTestData.autoimmunoProfile || null,
        cardiology: parsedTestData.cardiology || null,
        rft: parsedTestData.rft || null,
        lft: parsedTestData.lft || null,
        diseaseHistory: parsedTestData.diseaseHistory || null,
        imaging: parsedTestData.imaging || null,
        hematology: parsedTestData.hematology || null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test data saved successfully',
      test: savedTest
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error saving patient test data:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to save patient test data' },
      { status: 500 }
    )
  }
}

