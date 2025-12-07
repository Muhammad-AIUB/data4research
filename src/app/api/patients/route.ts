import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

export async function POST(request: Request) {
  try {
    // @ts-expect-error - getServerSession type inference issue
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.id) {
      console.error('Session user ID is missing:', session)
      return NextResponse.json({ message: 'User ID not found in session. Please log out and log back in.' }, { status: 401 })
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
      finalDiagnosis
    } = body

    const patient = await prisma.patient.create({
      data: {
        name,
        dateOfBirth: new Date(dateOfBirth),
        age,
        ethnicity: ethnicity || 'south-asian',
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

