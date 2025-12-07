'use client'

// TypeScript fixes applied
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useSWR from "swr"
import { useState } from "react"
import { useRouter } from "next/navigation"
import DateOfBirthSelector from "@/components/DateOfBirthSelector"
import TagInput from "@/components/TagInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectItem, SelectValue } from "@/components/ui/select"

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const fetcher = (url: string) => fetch(url).then(res => res.json())

const schema = z.object({
  name: z.string().min(2, "Name required"),
  mobile: z.string().regex(/^01[3-9]\d{8}$/, "Valid BD mobile number required (11 digits)"),
  age: z.number().min(0).max(120, "Age must be between 0 and 120"),
  relativeMobile: z.string().regex(/^01[3-9]\d{8}$/, "Valid BD mobile number required (11 digits)"),
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
})

export default function AddPatient() {
  const { data, error } = useSWR("/api/options", fetcher)
  const router = useRouter()
  const [day, setDay] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      age: 0
    }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)

    // Use age from form data, fallback to state if needed
    const finalAge = data.age || (typeof age === 'number' ? age : 0)

    // Calculate date of birth from age if calendar is filled, otherwise use a default date
    let dateOfBirth: Date
    if (day && month && year) {
      const monthIndex = months.indexOf(month) + 1
      dateOfBirth = new Date(parseInt(year), monthIndex - 1, parseInt(day))
    } else {
      // If no date of birth provided, estimate from age (use January 1st of estimated year)
      const currentYear = new Date().getFullYear()
      dateOfBirth = new Date(currentYear - finalAge, 0, 1)
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
    }

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      })

      if (res.ok) {
        const result = await res.json()
        // Navigate with patient ID (use patientId field from response)
        const patientIdToUse = result.patient?.patientId || result.patient?.id
        router.push(`/dashboard/add-patient/next?patientId=${patientIdToUse}`)
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error occurred' }))
        alert(errorData.message || "Failed to add patient. Please check all required fields.")
        setLoading(false)
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      alert("Failed to add patient. Please check your connection and try again.")
      setLoading(false)
    }
  }

  if (error) return <div className="p-8">Error loading options</div>
  if (!data) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Patient</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <Label>Name *</Label>
          <Input {...register("name")} />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
        </div>

        {/* Date of Birth + Age */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date of Birth</Label>
            <DateOfBirthSelector 
              day={day} 
              setDay={setDay} 
              month={month} 
              setMonth={setMonth} 
              year={year} 
              setYear={setYear} 
              onAgeChange={(newAge) => {
                setAge(newAge)
                if (typeof newAge === 'number') {
                  setValue("age", newAge, { shouldValidate: true })
                }
              }} 
            />
          </div>
          <div>
            <Label>Age *</Label>
            <Input 
              type="number" 
              {...register("age", { 
                valueAsNumber: true,
                onChange: (e) => {
                  const val = e.target.value
                  const numVal = val === "" ? "" : (parseInt(val) || 0)
                  setAge(numVal)
                }
              })}
              placeholder="Enter age"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message as string}</p>}
          </div>
        </div>

        {/* Patient ID */}
        <div>
          <Label>Patient ID</Label>
          <Input {...register("patientId")} />
        </div>

        {/* Ethnicity */}
        <div>
          <Label>Ethnicity</Label>
          <Select defaultValue="south-asian" onValueChange={v => setValue("ethnicity", v)}>
            <SelectValue placeholder="Select Ethnicity" />
            {data.ethnicities?.map((e: any) => (
              <SelectItem key={e.id} value={e.value}>{e.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Religion */}
        <div>
          <Label>Religion</Label>
          <Select defaultValue="islam" onValueChange={v => setValue("religion", v)}>
            <SelectValue placeholder="Select Religion" />
            {data.religions?.map((r: any) => (
              <SelectItem key={r.id} value={r.value}>{r.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Mobile */}
        <div>
          <Label>Patient Mobile *</Label>
          <Input {...register("mobile")} placeholder="01xxxxxxxxx" />
          {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message as string}</p>}
        </div>

        {/* Spouse Mobile */}
        <div>
          <Label>Spouse Mobile</Label>
          <Input {...register("spouseMobile")} placeholder="01xxxxxxxxx" />
        </div>

        {/* Relative Mobile */}
        <div>
          <Label>First Degree Relative's Mobile * (Blood related e.g. son, daughter, father, mother, brother or sister)</Label>
          <Input {...register("relativeMobile")} placeholder="01xxxxxxxxx" />
          {errors.relativeMobile && <p className="text-red-500 text-sm mt-1">{errors.relativeMobile.message as string}</p>}
        </div>

        {/* NID */}
        <div>
          <Label>NID</Label>
          <Input {...register("nid")} placeholder="National ID" />
        </div>

        {/* District */}
        <div>
          <Label>District</Label>
          <Select onValueChange={v => setValue("district", v)}>
            <SelectValue placeholder="Select District" />
            {data.districts?.map((d: any) => (
              <SelectItem key={d.id} value={d.value}>{d.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Address */}
        <div>
          <Label>Address</Label>
          <Input {...register("address")} placeholder="Full address" />
        </div>

        {/* Tags */}
        <div>
          <Label>Tags</Label>
          <TagInput tags={tags} setTags={setTags} />
        </div>

        {/* Short History */}
        <div>
          <Label>Short History</Label>
          <textarea {...register("shortHistory")} className="w-full px-3 py-2 border rounded-md min-h-20" />
        </div>

        {/* Surgical History */}
        <div>
          <Label>Surgical History</Label>
          <textarea {...register("surgicalHistory")} className="w-full px-3 py-2 border rounded-md min-h-20" />
        </div>

        {/* Family History */}
        <div>
          <Label>Family History</Label>
          <textarea {...register("familyHistory")} className="w-full px-3 py-2 border rounded-md min-h-20" />
        </div>

        {/* Past Illness */}
        <div>
          <Label>Past Illness</Label>
          <textarea {...register("pastIllness")} className="w-full px-3 py-2 border rounded-md min-h-20" />
        </div>

        {/* Special Notes */}
        <div>
          <Label>Special Notes</Label>
          <textarea {...register("specialNotes")} className="w-full px-3 py-2 border rounded-md min-h-20" />
        </div>

        {/* Final Diagnosis */}
        <div>
          <Label>Final Diagnosis</Label>
          <textarea {...register("finalDiagnosis")} className="w-full px-3 py-2 border rounded-md min-h-20" />
        </div>

        {/* Next Button */}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving..." : "Next"}
        </Button>
      </form>
    </div>
  )
}

