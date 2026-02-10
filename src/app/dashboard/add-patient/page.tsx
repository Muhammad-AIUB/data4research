"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR from "swr";
import { useState, useCallback } from "react";
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

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const schema = z.object({
  name: z.string().min(2, "Name required"),
  sex: z
    .enum(["MALE", "FEMALE", "OTHERS"])
    .refine((val) => !!val, { message: "Sex is required" }),
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

export default function AddPatient() {
  const { data, error } = useSWR("/api/options", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });
  const router = useRouter();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      age: 0,
    },
  });

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

    const finalData = {
      ...data,
      dateOfBirth: dateOfBirth.toISOString(),
      age: finalAge,
      tags,
      ethnicity: data.ethnicity || "south-asian",
      religion: data.religion || "islam",
      district: data.district || "",
      address: data.address || "",
    };

    if (process.env.NODE_ENV === "development") {
      console.log("Submitting patient data:", finalData);
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(finalData),
      });
      console.log('Fetch response status:', res.status, 'ok:', res.ok);

      if (res.ok) {
        const result = await res.json();
        alert("Patient saved successfully!");
        const patientIdToUse = result.patient?.patientId || result.patient?.id;
        if (patientIdToUse) {
          router.push(
            `/dashboard/add-patient/next?patientId=${patientIdToUse}`,
          );
        } else {
          router.push("/dashboard/patients");
        }
      } else {
        let errorData: { message?: string; error?: string } = {};
        try {
          const text = await res.text();
          if (text) {
            try {
              errorData = JSON.parse(text);
            } catch {
              // Server returned plain text (or invalid JSON), capture it
              errorData = { message: text };
            }
          } else {
            // Empty body — provide helpful info
            errorData = { message: `Empty response body (status ${res.status})` };
          }
        } catch (e) {
          console.error("Failed to read error response:", e);
          errorData = { message: `Could not read error response (status ${res.status})` };
        }

        console.log('Parsed error data:', errorData);

        console.error("API Error Response:", {
          status: res.status,
          statusText: res.statusText,
          errorData,
          url: res.url,
        });

        const errorMsg =
          errorData?.message ||
          errorData?.error ||
          `Failed to add patient (Status: ${res.status}). Please check all required fields and try again.`;
        alert(errorMsg);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(
        `Failed to add patient: ${errorMessage}. Please check your connection and try again.`,
      );
      setLoading(false);
    }
  };

  if (error) return <div className="p-8">Error loading options</div>;
  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-0 md:p-8 flex items-center justify-center relative overflow-x-hidden text-slate-800">
      <div className="w-full max-w-4xl z-10">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg rounded-t-3xl shadow-md border-b border-blue-100 px-8 py-6 flex flex-col items-center mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 tracking-tight mb-2">
            Add New Patient
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Enter patient information to create a new record
          </p>
        </div>
        <div className="backdrop-blur-sm bg-white/90 rounded-b-3xl shadow-xl border border-blue-100 px-4 md:px-12 py-10 md:py-14 mt-0 space-y-12 transition-all duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Name <span className="text-pink-500">*</span>
                  </Label>
                  <Input
                    {...register("name")}
                    className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                    placeholder="Enter patient name"
                  />
                  {errors.name && (
                    <p className="text-pink-600 text-sm mt-1 font-medium">
                      {errors.name.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Sex <span className="text-pink-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("sex", value as "MALE" | "FEMALE" | "OTHERS")
                    }
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                  >
                    <SelectValue placeholder="Select sex" />
                    <SelectItem value="MALE">MALE</SelectItem>
                    <SelectItem value="FEMALE">FEMALE</SelectItem>
                    <SelectItem value="OTHERS">OTHERS</SelectItem>
                  </Select>
                  {errors.sex && (
                    <p className="text-pink-600 text-sm mt-1 font-medium">
                      {errors.sex.message as string}
                    </p>
                  )}
                </div>
              </div>
            </section>
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Date of Birth
                  </Label>
                  <div className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl p-4 shadow-md">
                    <DateOfBirthSelector
                      day={day}
                      setDay={setDay}
                      month={month}
                      setMonth={setMonth}
                      year={year}
                      setYear={setYear}
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
                    className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                    placeholder="Enter age"
                  />
                  {errors.age && (
                    <p className="text-pink-600 text-sm mt-1 font-medium">
                      {errors.age.message as string}
                    </p>
                  )}
                </div>
              </div>
            </section>
            <section className="space-y-2">
              <Label className="text-base font-semibold text-gray-800">
                Patient ID
              </Label>
              <Input
                {...register("patientId")}
                className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                placeholder="Enter patient ID"
              />
            </section>
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Ethnicity
                  </Label>
                  <Select
                    defaultValue="south-asian"
                    onValueChange={(v) => setValue("ethnicity", v)}
                    className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                  >
                    <SelectValue placeholder="Select Ethnicity" />
                    <SelectContent>
                      {data.ethnicities?.map((e: OptionItem) => (
                        <SelectItem key={e.id} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Religion
                  </Label>
                  <Select
                    defaultValue="islam"
                    onValueChange={(v) => setValue("religion", v)}
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                  >
                    <SelectValue placeholder="Select Religion" />
                    <SelectContent>
                      {data.religions?.map((r: OptionItem) => (
                        <SelectItem key={r.id} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Patient Mobile <span className="text-pink-500">*</span>
                  </Label>
                  <Input
                    {...register("mobile")}
                    placeholder="01xxxxxxxxx"
                    className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                  />
                  {errors.mobile && (
                    <p className="text-pink-600 text-sm mt-1 font-medium">
                      {errors.mobile.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Spouse Mobile
                  </Label>
                  <Input
                    {...register("spouseMobile")}
                    placeholder="01xxxxxxxxx"
                    className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800">
                  First Degree Relative&apos;s Mobile{" "}
                  <span className="text-pink-500">*</span>{" "}
                  <span className="text-xs text-gray-500">
                    (Blood related e.g. son, daughter, father, mother, brother
                    or sister)
                  </span>
                </Label>
                <Input
                  {...register("relativeMobile")}
                  placeholder="01xxxxxxxxx"
                  className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                />
                {errors.relativeMobile && (
                  <p className="text-pink-600 text-sm mt-1 font-medium">
                    {errors.relativeMobile.message as string}
                  </p>
                )}
              </div>
            </section>
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    NID
                  </Label>
                  <Input
                    {...register("nid")}
                    placeholder="National ID"
                    className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800 mb-4 block">
                    District
                  </Label>
                  <Select
                    onValueChange={(v) => setValue("district", v)}
                    className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                  >
                    <SelectValue placeholder="Select District" />
                    <SelectContent>
                      {data.districts?.map((d: OptionItem) => (
                        <SelectItem key={d.id} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800">
                  Address
                </Label>
                <Input
                  {...register("address")}
                  placeholder="Full address"
                  className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 shadow-md focus:shadow-xl"
                />
              </div>
            </section>

            {/* Tags */}
            <section className="space-y-2">
              <Label className="text-base font-semibold text-gray-800">
                Tags
              </Label>
              <div className="backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl p-4 shadow-md">
                <TagInput tags={tags} setTags={setTags} />
              </div>
            </section>
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Medical History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Short History
                  </Label>
                  <textarea
                    {...register("shortHistory")}
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 min-h-20 resize-none shadow-md focus:shadow-xl"
                    placeholder="Brief medical history..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Surgical History
                  </Label>
                  <textarea
                    {...register("surgicalHistory")}
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 min-h-20 resize-none shadow-md focus:shadow-xl"
                    placeholder="Previous surgeries..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Family History
                  </Label>
                  <textarea
                    {...register("familyHistory")}
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 min-h-20 resize-none shadow-md focus:shadow-xl"
                    placeholder="Family medical conditions..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Past Illness
                  </Label>
                  <textarea
                    {...register("pastIllness")}
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 min-h-20 resize-none shadow-md focus:shadow-xl"
                    placeholder="Previous illnesses..."
                  />
                </div>
              </div>
            </section>
            <section className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-700/80 border-b border-blue-100 pb-2 mb-4 tracking-tight">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Special Notes
                  </Label>
                  <textarea
                    {...register("specialNotes")}
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 min-h-20 resize-none shadow-md focus:shadow-xl"
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-800">
                    Final Diagnosis
                  </Label>
                  <textarea
                    {...register("finalDiagnosis")}
                    className="w-full backdrop-blur-lg bg-white/70 border border-white/40 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all duration-200 min-h-20 resize-none shadow-md focus:shadow-xl"
                    placeholder="Diagnosis details..."
                  />
                </div>
              </div>
            </section>
            <div className="pt-8 flex justify-center">
              <Button
                type="submit"
                className="w-full md:w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg tracking-wide"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="ml-2">Saving...</span>
                  </span>
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
