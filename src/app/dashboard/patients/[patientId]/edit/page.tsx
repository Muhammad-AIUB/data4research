import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import EditPatientForm from "./EditPatientForm";
import type { Session } from "next-auth";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  // Auth guard — redirect unauthenticated users
  // @ts-expect-error - authOptions type mismatch with next-auth overloads
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) {
    redirect("/login");
  }

  const { patientId } = await params;

  // Parallel data fetch — patient + dropdown options in one round-trip
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
  const whereClause = isUUID ? { id: patientId } : { patientId };

  const [patient, religions, ethnicities, districts] = await Promise.all([
    prisma.patient.findUnique({
      where: whereClause,
      select: {
        id: true,
        name: true,
        age: true,
        mobile: true,
        patientId: true,
        dateOfBirth: true,
        ethnicity: true,
        religion: true,
        nid: true,
        spouseMobile: true,
        relativeMobile: true,
        district: true,
        address: true,
        shortHistory: true,
        surgicalHistory: true,
        familyHistory: true,
        pastIllness: true,
        tags: true,
        specialNotes: true,
        finalDiagnosis: true,
      },
    }),
    prisma.option.findMany({
      where: { category: "religion" },
      select: { id: true, label: true, value: true },
      orderBy: { order: "asc" },
    }),
    prisma.option.findMany({
      where: { category: "ethnicity" },
      select: { id: true, label: true, value: true },
      orderBy: { order: "asc" },
    }),
    prisma.option.findMany({
      where: { category: "district" },
      select: { id: true, label: true, value: true },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!patient) {
    notFound();
  }

  // Serialize Date to ISO string for the client component
  const serializedPatient = {
    ...patient,
    dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
  };

  return (
    <EditPatientForm
      patient={serializedPatient}
      options={{ religions, ethnicities, districts }}
    />
  );
}
