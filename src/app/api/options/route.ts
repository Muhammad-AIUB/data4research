import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const religions = await prisma.option.findMany({
      where: { category: "religion" },
      orderBy: { order: "asc" }
    })
    
    const ethnicities = await prisma.option.findMany({
      where: { category: "ethnicity" },
      orderBy: { order: "asc" }
    })
    
    const districts = await prisma.option.findMany({
      where: { category: "district" },
      orderBy: { order: "asc" }
    })

    return NextResponse.json({ religions, ethnicities, districts })
  } catch (error: any) {
    console.error('Error fetching options:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch options' },
      { status: 500 }
    )
  }
}
