"use client";

import { Printer, Download } from "lucide-react";
import * as XLSX from "xlsx";

type TestItem = { label: string; value: string };

export type PatientExportData = {
  name: string;
  patientId: string | null;
  age: string | null;
  mobile: string | null;
  nid: string | null;
  ethnicity: string | null;
  religion: string | null;
  dateOfBirth: Date | string | null;
  spouseMobile: string | null;
  relativeMobile: string | null;
  district: string | null;
  address: string | null;
  shortHistory: string | null;
  surgicalHistory: string | null;
  familyHistory: string | null;
  pastIllness: string | null;
  specialNotes: string | null;
  finalDiagnosis: string | null;
  tags: string[];
  createdAt: Date | string;
  groupedTests: Array<{
    date: string;
    reports: Array<{
      reportType: string;
      items: TestItem[];
    }>;
  }>;
};

interface Props {
  patient: PatientExportData;
}

export default function PatientActions({ patient }: Props) {
  const handlePrint = () => {
    const fmt = (v: string | null | undefined) => v || "-";
    const fmtDate = (d: Date | string | null | undefined) =>
      d ? new Date(d).toLocaleDateString("en-GB") : "-";

    const infoRows = [
      ["Patient ID", fmt(patient.patientId)],
      ["Name", fmt(patient.name)],
      ["Age", fmt(patient.age)],
      ["Date of Birth", fmtDate(patient.dateOfBirth)],
      ["Mobile", fmt(patient.mobile)],
      ["NID", fmt(patient.nid)],
      ["Ethnicity", fmt(patient.ethnicity)],
      ["Religion", fmt(patient.religion)],
      ["Spouse Mobile", fmt(patient.spouseMobile)],
      ["Relative Mobile", fmt(patient.relativeMobile)],
      ["District", fmt(patient.district)],
      ["Address", fmt(patient.address)],
      ["Tags", patient.tags?.length ? patient.tags.join(", ") : "-"],
      ["Registered", fmtDate(patient.createdAt)],
    ];

    const clinicalFields: [string, string | null][] = [
      ["Short History", patient.shortHistory],
      ["Surgical History", patient.surgicalHistory],
      ["Family History", patient.familyHistory],
      ["Past Illness", patient.pastIllness],
      ["Special Notes", patient.specialNotes],
      ["Final Diagnosis", patient.finalDiagnosis],
    ];
    const clinicalRows = clinicalFields.filter(([, v]) => v);

    const testSections = patient.groupedTests
      .map(({ date, reports }) => {
        if (!reports.length) return "";
        const reportBlocks = reports
          .map(
            ({ reportType, items }) => `
            <div style="margin-bottom:12px;">
              <div style="font-weight:600;font-size:13px;color:#1e40af;border-bottom:1px solid #bfdbfe;padding-bottom:4px;margin-bottom:6px;">${reportType}</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                ${items
                  .map(
                    (it) => `<tr>
                  <td style="padding:3px 6px;color:#475569;width:55%;">${it.label}</td>
                  <td style="padding:3px 6px;font-weight:500;color:#1e293b;">${it.value}</td>
                </tr>`,
                  )
                  .join("")}
              </table>
            </div>`,
          )
          .join("");
        return `
          <div style="margin-bottom:20px;page-break-inside:avoid;">
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;font-weight:700;font-size:14px;color:#1e3a8a;margin-bottom:10px;">
              Date: ${date}
            </div>
            ${reportBlocks}
          </div>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Patient Details – ${patient.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 24px 32px; }
    h1 { font-size: 22px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px; }
    h2 { font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 20px 0 8px; border-bottom: 2px solid #bfdbfe; padding-bottom: 4px; }
    .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 18px; }
    .patient-name { font-size: 20px; font-weight: 800; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 12px; margin-bottom: 4px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
    .info-val { font-size: 13px; font-weight: 600; }
    .clinical-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; }
    .clinical-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 3px; }
    .diagnosis { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; }
    @media print {
      body { padding: 12px 16px; }
      @page { margin: 1.2cm; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <div style="font-size:11px;color:#64748b;margin-bottom:2px;">Data4Research</div>
      <h1>Patient Details</h1>
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b;">
      Printed: ${new Date().toLocaleString("en-GB")}<br/>
      ID: ${patient.patientId ?? "-"}
    </div>
  </div>

  <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
    <div style="width:52px;height:52px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:800;flex-shrink:0;">
      ${(patient.name ?? "P").split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase()}
    </div>
    <div>
      <div class="patient-name">${patient.name}</div>
      <div style="font-size:12px;color:#64748b;">${patient.district ?? ""} • Registered ${fmtDate(patient.createdAt)}</div>
    </div>
  </div>

  <div class="info-grid">
    ${infoRows
      .map(
        ([lbl, val]) => `<div class="info-item">
      <span class="info-label">${lbl}</span>
      <span class="info-val">${val}</span>
    </div>`,
      )
      .join("")}
  </div>

  ${
    clinicalRows.length
      ? `<h2>Clinical Information</h2>
    ${clinicalRows
      .map(
        ([lbl, val]) =>
          lbl === "Final Diagnosis"
            ? `<div class="diagnosis"><div class="clinical-label">${lbl}</div><div>${val}</div></div>`
            : `<div class="clinical-block"><div class="clinical-label">${lbl}</div><div>${val}</div></div>`,
      )
      .join("")}`
      : ""
  }

  ${
    patient.groupedTests.length
      ? `<h2>Test Reports (${patient.groupedTests.reduce((s, g) => s + g.reports.length, 0)} reports)</h2>
    ${testSections}`
      : ""
  }
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Patient Info ──────────────────────────────────────────────
    const infoRows: [string, string][] = [
      ["Field", "Value"],
      ["Name", patient.name ?? ""],
      ["Patient ID", patient.patientId ?? ""],
      ["Age", patient.age ?? ""],
      ["Date of Birth", patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : ""],
      ["Mobile", patient.mobile ?? ""],
      ["NID", patient.nid ?? ""],
      ["Ethnicity", patient.ethnicity ?? ""],
      ["Religion", patient.religion ?? ""],
      ["Spouse Mobile", patient.spouseMobile ?? ""],
      ["Relative Mobile", patient.relativeMobile ?? ""],
      ["District", patient.district ?? ""],
      ["Address", patient.address ?? ""],
      ["Tags", patient.tags?.join(", ") ?? ""],
      ["Registered", new Date(patient.createdAt).toLocaleDateString()],
      ["", ""],
      ["Short History", patient.shortHistory ?? ""],
      ["Surgical History", patient.surgicalHistory ?? ""],
      ["Family History", patient.familyHistory ?? ""],
      ["Past Illness", patient.pastIllness ?? ""],
      ["Special Notes", patient.specialNotes ?? ""],
      ["Final Diagnosis", patient.finalDiagnosis ?? ""],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
    wsInfo["!cols"] = [{ wch: 22 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Patient Info");

    // ── Sheet 2: Test Reports ──────────────────────────────────────────────
    const reportRows: string[][] = [
      ["Date", "Report Type", "Field", "Value"],
    ];

    for (const group of patient.groupedTests) {
      for (const report of group.reports) {
        for (const item of report.items) {
          reportRows.push([group.date, report.reportType, item.label, item.value]);
        }
      }
      // blank separator row between dates
      reportRows.push(["", "", "", ""]);
    }

    const wsReports = XLSX.utils.aoa_to_sheet(reportRows);
    wsReports["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 45 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsReports, "Test Reports");

    XLSX.writeFile(
      wb,
      `${patient.name?.replace(/\s+/g, "_") ?? "patient"}_${patient.patientId ?? "export"}.xlsx`,
    );
  };

  return (
    <div className="flex gap-2 print:hidden">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all border border-slate-200"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      <button
        onClick={handleDownloadExcel}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all"
      >
        <Download className="w-4 h-4" />
        Download Excel
      </button>
    </div>
  );
}
