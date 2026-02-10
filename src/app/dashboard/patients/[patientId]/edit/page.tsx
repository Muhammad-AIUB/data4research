"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR from "swr";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import DateOfBirthSelector from "@/components/DateOfBirthSelector";
import TagInput from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import Link from "next/link";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const schema = z.object({
  name: z.string().min(2, "Name required"),
  mobile: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Valid BD mobile number required (11 digits)"),
  age: z.number().min(0).max(120, "Age must be between 0 and 120"),
  relativeMobile: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Valid BD mobile number required (11 digits)"),
  patientId: z.string().optional(),
  ethnicity: z.string().optional(),
  religion: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  nid: z.string().optional(),
  spouseMobile: z.string().optional(),
  shortHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  pastIllness: z.string().optional(),
  specialNotes: z.string().optional(),
  finalDiagnosis: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type OptionItem = {
  id: string;
  value: string;
  label: string;
};

type PatientData = {
  id: string;
  name: string;
  age: number;
  mobile: string;
  patientId?: string | null;
  dateOfBirth?: string;
  ethnicity?: string;
  religion?: string;
  nid?: string | null;
  spouseMobile?: string | null;
  relativeMobile?: string | null;
  district?: string;
  address?: string;
  shortHistory?: string | null;
  surgicalHistory?: string | null;
  familyHistory?: string | null;
  pastIllness?: string | null;
  tags?: string[];
  specialNotes?: string | null;
  finalDiagnosis?: string | null;
};

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const router = useRouter();

  const { data: optionsData, error: optionsError } = useSWR("/api/options", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const { data: patientResponse, error: patientError } = useSWR(
    `/api/patients?id=${patientId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { age: 0 },
  });

  // Populate patient data
  useEffect(() => {
    if (!patientResponse?.patient || initialized) return;

    const found = patientResponse.patient;

    setPatient(found);

    // Populate form
    reset({
      name: found.name || "",
      mobile: found.mobile || "",
      age: found.age || 0,
      relativeMobile: found.relativeMobile || "",
      patientId: found.patientId || "",
      ethnicity: found.ethnicity || "",
      religion: found.religion || "",
      district: found.district || "",
      address: found.address || "",
      nid: found.nid || "",
      spouseMobile: found.spouseMobile || "",
      shortHistory: found.shortHistory || "",
      surgicalHistory: found.surgicalHistory || "",
      familyHistory: found.familyHistory || "",
      pastIllness: found.pastIllness || "",
      specialNotes: found.specialNotes || "",
      finalDiagnosis: found.finalDiagnosis || "",
    });
    setAge(found.age || 0);
    setTags(found.tags || []);

    // Populate DOB
    if (found.dateOfBirth) {
      const dob = new Date(found.dateOfBirth);
      setDay(String(dob.getDate()));
      setMonth(months[dob.getMonth()]);
      setYear(String(dob.getFullYear()));
    }

    setInitialized(true);
  }, [patientResponse, patientId, reset, initialized]);

  const handleAgeChange = useCallback(
    (newAge: number | "") => {
      setAge(newAge);
      if (typeof newAge === "number") {
        setValue("age", newAge, { shouldValidate: true });
      }
    },
    [setValue],
  );

  const onSubmit = async (data: FormData) => {
    if (!patient) return;
    setLoading(true);

    const finalAge = data.age || (typeof age === "number" ? age : 0);

    let dateOfBirth: Date;
    if (day && month && year) {
      const monthIndex = months.indexOf(month) + 1;
      dateOfBirth = new Date(parseInt(year), monthIndex - 1, parseInt(day));
    } else {
      const currentYear = new Date().getFullYear();
      dateOfBirth = new Date(currentYear - finalAge, 0, 1);
    }

    try {
      const res = await fetch("/api/patients", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: patient.id,
          ...data,
          dateOfBirth: dateOfBirth.toISOString(),
          age: finalAge,
          tags,
        }),
      });

      if (res.ok) {
        alert("Patient updated successfully!");
        router.push(`/dashboard/patients/${patient.patientId || patient.id}`);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update patient.");
      }
    } catch {
      alert("Failed to update patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (optionsError || patientError) {
    return <div className="p-8 text-red-500">Error loading data. Please try again.</div>;
  }

  if (!optionsData || !patientResponse) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (patientResponse && !patientResponse.patient) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto bg-white/95 rounded-2xl shadow-lg border border-blue-100 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Patient Not Found</h1>
          <Link href="/dashboard/patients" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to All Patients
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl";
  const textareaClass = `w-full ${inputClass} min-h-20 resize-none`;

  return (
    <div className="min-h-screen p-0 md:p-8 flex items-center justify-center relative overflow-x-hidden text-slate-800">
      <div className="w-full max-w-4xl z-10">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg rounded-t-3xl shadow-md border-b border-blue-100 px-8 py-6 flex flex-col items-center mb-0">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/dashboard/patients/${patient?.patientId || patient?.id || patientId}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-amber-600 tracking-tight mb-2">
            Edit Patient
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Update patient information
          </p>
        </div>
        <div className="backdrop-blur-sm bg-white/90 rounded-b-3xl shadow-xl border border-blue-100 px-4 md:px-12 py-10 md:py-14 mt-0 space-y-12 transition-all duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {/* Basic Info */}
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Name <span className="text-pink-500">*</span>
                  </Label>
                  <Input {...register("name")} className={inputClass} placeholder="Patient name" />
                  {errors.name && (
                    <p className="text-pink-600 text-sm mt-1 font-medium">{errors.name.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Patient ID</Label>
                  <Input {...register("patientId")} className={inputClass} placeholder="Patient ID" />
                </div>
              </div>
            </section>

            {/* DOB & Age */}
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Date of Birth</Label>
                  <div className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl p-4 shadow-md">
                    <DateOfBirthSelector
                      day={day} setDay={setDay}
                      month={month} setMonth={setMonth}
                      year={year} setYear={setYear}
                      onAgeChange={handleAgeChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Age <span className="text-pink-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    {...register("age", {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const val = e.target.value;
                        const numVal = val === "" ? "" : parseInt(val) || 0;
                        setAge(numVal);
                      },
                    })}
                    className={inputClass}
                    placeholder="Age"
                  />
                  {errors.age && (
                    <p className="text-pink-600 text-sm mt-1 font-medium">{errors.age.message as string}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Ethnicity & Religion */}
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Ethnicity</Label>
                  <Select
                    defaultValue={patient?.ethnicity || "south-asian"}
                    onValueChange={(v) => setValue("ethnicity", v)}
                    className={inputClass}
                  >
                    <SelectValue placeholder="Select Ethnicity" />
                    <SelectContent>
                      {optionsData.ethnicities?.map((e: OptionItem) => (
                        <SelectItem key={e.id} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Religion</Label>
                  <Select
                    defaultValue={patient?.religion || "islam"}
                    onValueChange={(v) => setValue("religion", v)}
                    className={`w-full ${inputClass}`}
                  >
                    <SelectValue placeholder="Select Religion" />
                    <SelectContent>
                      {optionsData.religions?.map((r: OptionItem) => (
                        <SelectItem key={r.id} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Patient Mobile <span className="text-pink-500">*</span>
                  </Label>
                  <Input {...register("mobile")} placeholder="01xxxxxxxxx" className={inputClass} />
                  {errors.mobile && (
                    <p className="text-pink-600 text-sm mt-1 font-medium">{errors.mobile.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Spouse Mobile</Label>
                  <Input {...register("spouseMobile")} placeholder="01xxxxxxxxx" className={inputClass} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800">
                  First Degree Relative&apos;s Mobile <span className="text-pink-500">*</span>
                </Label>
                <Input {...register("relativeMobile")} placeholder="01xxxxxxxxx" className={inputClass} />
                {errors.relativeMobile && (
                  <p className="text-pink-600 text-sm mt-1 font-medium">{errors.relativeMobile.message as string}</p>
                )}
              </div>
            </section>

            {/* Location */}
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">NID</Label>
                  <Input {...register("nid")} placeholder="National ID" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800 mb-4 block">District</Label>
                  <Select
                    defaultValue={patient?.district || ""}
                    onValueChange={(v) => setValue("district", v)}
                    className={inputClass}
                  >
                    <SelectValue placeholder="Select District" />
                    <SelectContent>
                      {optionsData.districts?.map((d: OptionItem) => (
                        <SelectItem key={d.id} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800">Address</Label>
                <Input {...register("address")} placeholder="Full address" className={inputClass} />
              </div>
            </section>

            {/* Tags */}
            <section className="space-y-2">
              <Label className="text-base font-semibold text-gray-800">Tags</Label>
              <div className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl p-4 shadow-md">
                <TagInput tags={tags} setTags={setTags} />
              </div>
            </section>

            {/* Medical History */}
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Medical History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Short History</Label>
                  <textarea {...register("shortHistory")} className={textareaClass} placeholder="Brief medical history..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Surgical History</Label>
                  <textarea {...register("surgicalHistory")} className={textareaClass} placeholder="Previous surgeries..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Family History</Label>
                  <textarea {...register("familyHistory")} className={textareaClass} placeholder="Family medical conditions..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Past Illness</Label>
                  <textarea {...register("pastIllness")} className={textareaClass} placeholder="Previous illnesses..." />
                </div>
              </div>
            </section>

            {/* Additional */}
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Special Notes</Label>
                  <textarea {...register("specialNotes")} className={textareaClass} placeholder="Additional notes..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">Final Diagnosis</Label>
                  <textarea {...register("finalDiagnosis")} className={textareaClass} placeholder="Diagnosis details..." />
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-8 flex justify-center gap-4">
              <Link
                href={`/dashboard/patients/${patient?.patientId || patient?.id || patientId}`}
                className="w-full md:w-1/3 text-center bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-5 px-8 rounded-2xl shadow-lg transition-all text-lg"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                className="w-full md:w-1/3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-5 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg tracking-wide"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </span>
                ) : (
                  "Update Patient"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
