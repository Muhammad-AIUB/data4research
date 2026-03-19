import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { notFound, redirect } from "next/navigation";

import EditPatientForm from "./EditPatientForm";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopePatientAccess } from "@/lib/rbac";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) {
    redirect("/");
  }

  const { patientId } = await params;
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      patientId,
    );

  const [patient, religions, ethnicities, districts] = await Promise.all([
    prisma.patient.findFirst({
      where: scopePatientAccess(
        session.user,
        isUUID ? { id: patientId } : { patientId },
      ),
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
