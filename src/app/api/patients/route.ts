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
    let whereClause: any = {}

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
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch patients' },
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
    if (!name || !age || !mobile || !relativeMobile || !patientId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
        age: parseInt(age),
        ethnicity: ethnicity || '',
        religion: religion || 'islam',
        nid: nid || null,
        patientId,
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
        createdBy: session.user.id as string,
      }
    })

    return NextResponse.json({ success: true, patient }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating patient:', error)

    // Handle duplicate patientId gracefully
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { message: 'Patient ID already exists. Please use a different Patient ID.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: error.message || 'Failed to create patient' },
      { status: 500 }
    )
  }
}
