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
    const searchQuery = searchParams.get('search')

    // Build where clause for search
    let whereClause: Record<string, unknown> = {}

    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = searchQuery.trim()
      
      // Search in multiple fields: name, mobile, finalDiagnosis, and tags
      whereClause = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { mobile: { contains: searchTerm, mode: 'insensitive' } },
          { patientId: { contains: searchTerm, mode: 'insensitive' } },
          { finalDiagnosis: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { has: searchTerm } }, // Search in tags array
          { relativeMobile: { contains: searchTerm, mode: 'insensitive' } },
          { spouseMobile: { contains: searchTerm, mode: 'insensitive' } },
        ]
      }
    }

    // Fetch all patients with search filter
    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        tests: {
          orderBy: {
            sampleDate: 'desc'
          },
          take: 1 // Get latest test for each patient
        }
      }
    })

    return NextResponse.json({ patients }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching patients:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch patients'
    return NextResponse.json(
      { message },
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

    // Verify user exists in database
    const userId = session.user.id as string
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.error('User not found in database:', userId)
      return NextResponse.json(
        { message: 'User account not found. Please log in again.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      dateOfBirth,
      age,
      ethnicity,
      religion,
      nid,
      patientId,
      mobile,
      spouseMobile,
      relativeMobile,
      district,
      address,
      shortHistory,
      surgicalHistory,
      familyHistory,
      pastIllness,
      tags,
      specialNotes,
      finalDiagnosis,
    } = body

    // Validate required fields
    if (!name || !age || !mobile || !relativeMobile) {
      return NextResponse.json(
        { message: 'Missing required fields: Name, Age, Mobile, and Relative Mobile are required' },
        { status: 400 }
      )
    }

    // Validate age is a valid number
    const ageNum = parseInt(age)
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      return NextResponse.json(
        { message: 'Age must be a valid number between 0 and 120' },
        { status: 400 }
      )
    }

    // Prepare patient data
    const patientData = {
      name,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      age: ageNum,
      ethnicity: ethnicity || '',
      religion: religion || 'islam',
      nid: nid || null,
      patientId: patientId && patientId.trim() !== '' ? patientId.trim() : null,
      mobile,
      spouseMobile: spouseMobile || null,
      relativeMobile: relativeMobile || null,
      district: district || '',
      address: address || '',
      shortHistory: shortHistory || null,
      surgicalHistory: surgicalHistory || null,
      familyHistory: familyHistory || null,
      pastIllness: pastIllness || null,
      tags: tags || [],
      specialNotes: specialNotes || null,
      finalDiagnosis: finalDiagnosis || null,
      createdBy: userId,
    }

    console.log('Creating patient with data:', JSON.stringify(patientData, null, 2))

    // Create patient
    const patient = await prisma.patient.create({
      data: patientData
    })

    return NextResponse.json({ success: true, patient }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating patient:', error)
    
    // Log full error details for debugging
    if (error && typeof error === 'object') {
      console.error('Error details:', JSON.stringify(error, null, 2))
      if ('code' in error) {
        console.error('Prisma error code:', error.code)
      }
      if ('meta' in error) {
        console.error('Prisma error meta:', error.meta)
      }
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: Record<string, unknown>; message?: string }
      
      // Duplicate patientId
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { message: 'Patient ID already exists. Please use a different Patient ID.' },
          { status: 409 }
        )
      }
      
      // Foreign key constraint (user doesn't exist)
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { message: 'User account not found. Please log out and log in again.' },
          { status: 401 }
        )
      }
    }

    // Get detailed error message
    let message = 'Failed to create patient'
    if (error instanceof Error) {
      message = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message)
    }
    
    // Don't expose stack trace in production
    const errorResponse: { message: string; error?: string } = { message }
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = error instanceof Error ? error.stack : String(error)
    }
    
    return NextResponse.json(
      errorResponse,
      { status: 500 }
    )
  }
}
