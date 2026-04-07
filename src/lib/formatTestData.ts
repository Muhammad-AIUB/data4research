


const fieldLabels: Record<string, Record<string, string>> = {
  autoimmunoProfile: {
    ana: "ANA (IFA, ELISA, or multiplex)",
    antiDsDna: "Anti–dsDNA",
    antiSm: "Anti–Sm",
    antiSsaRo60: "Anti–SSA (Ro60)",
    antiSsbLa: "Anti–SSB (La)",
    antiRnp: "Anti–RNP",
    antiScl70: "Anti–Scl-70 (Topoisomerase I)",
    antiCentromere: "Anti–Centromere",
    antiHistone: "Anti–Histone",
    antiNucleosome: "Anti–Nucleosome",
    antiChromatin: "Anti–Chromatin",
    antiRibosomalP: "Anti–Ribosomal P",
    antiPmScl: "Anti–PM/Scl",
    antiJo1: "Anti–Jo-1 (myositis)",
    antiSsaRo60Extended: "Anti-SSA/Ro60",
    antiRo52: "Anti-Ro52",
    antiSsbLaExtended: "Anti-SSB/La",
    antiSmExtended: "Anti-Sm",
    antiRnpExtended: "Anti-RNP",
    antiScl70Extended: "Anti-Scl-70",
    antiCentromereB: "Anti-Centromere B",
    antiJo1Extended: "Anti-Jo-1",
    antiMi2: "Anti-Mi-2 (Dermatomyositis)",
    antiTif1Gamma: "Anti-TIF1-γ",
    antiMda5: "Anti-MDA-5",
    antiSrp: "Anti-SRP",
    antiPl7: "Anti-PL-7",
    antiPl12: "Anti-PL-12",
    antiEj: "Anti-EJ",
    antiOj: "Anti-OJ",
    antiTpo: "Anti-TPO (Thyroid peroxidase antibody)",
    antiTg: "Anti-Tg (Thyroglobulin antibody)",
    trab: "TRAb (TSH receptor antibody)",
    tsi: "TSI (Thyroid Stimulating Immunoglobulin)",
    rheumatoidFactor: "Rheumatoid Factor (RF)",
    antiCcp: "Anti-CCP (Anti-cyclic citrullinated peptide)",
    anaRheumatoid: "ANA",
    esrRheumatoid: "ESR",
    crpRheumatoid: "CRP",
    hlaB27: "HLA-B27 (for spondyloarthropathy)",
    antiCarP: "Anti-CarP (Carbamylated protein antibody)",
    anaLiver: "ANA",
    asma: "ASMA (Anti-Smooth Muscle Ab)",
    lkm1Antibody: "LKM-1 antibody",
    slaLpAntibody: "SLA/LP antibody",
    ama: "AMA (Anti-Mitochondrial Antibody)",
    amaM2: "AMA-M2 specifically for PBC",
    pAncaLiver: "p-ANCA (for PSC)",
    cAnca: "c-ANCA (Proteinase-3 or PR3 Ab)",
    pAncaVasculitis: "p-ANCA (Myeloperoxidase or MPO Ab)",
    anaVasculitis: "ANA",
    antiGbm: "Anti-GBM (Goodpasture syndrome)",
    complementC3C4: "Complement C3, C4",
    antiAChR: "Anti-AChR (Acetylcholine receptor) – Myasthenia gravis",
    antiMuSK: "Anti-MuSK",
    antiVgkc: "Anti-VGKC (voltage-gated potassium channel)",
    antiGad65Neuro: "Anti-GAD65",
    antiNmdaReceptorAb: "Anti-NMDA receptor Ab",
    antiLgi1: "Anti-LGI1",
    antiCaspr2: "Anti-CASPR2",
    antiAquaporin4: "Anti-Aquaporin-4 (NMO)",
    antiMog: "Anti-MOG (Myelin oligodendrocyte glycoprotein)",
    antiTtgIga: "Anti-tTG IgA",
    antiTtgIgg: "Anti-tTG IgG",
    antiEma: "Anti-EMA (Endomysial Ab)",
    antiDgp: "Anti-DGP (Deamidated gliadin peptide)",
    totalIga: "Total IgA (to rule out IgA deficiency)",
    gad65Antibody: "GAD65 antibody",
    ia2Antibody: "IA-2 antibody",
    znt8Antibody: "ZnT8 antibody",
    ica: "ICA (Islet cell Ab)",
    iaa: "IAA (Insulin autoantibody)",
    anaKidney: "ANA",
    ancaKidney: "ANCA (p-ANCA, c-ANCA)",
    antiGbmKidney: "Anti-GBM",
    complementC3C4Kidney: "Complement (C3/C4)",
    antiPla2r: "Anti-PLA2R (Membranous nephropathy)",
    antiThsd7a: "Anti-THSD7A",
    antiDesmoglein1: "Anti-Desmoglein 1",
    antiDesmoglein3: "Anti-Desmoglein 3",
    antiBp180: "Anti-BP180 (Collagen XVII)",
    antiBp230: "Anti-BP230",
    antiEpidermalTransglutaminase: "Anti-Epidermal Transglutaminase",
    antiType7Collagen:
      "Anti-Type VII collagen (Epidermolysis bullosa acquisita)",
    lupusAnticoagulant: "Lupus anticoagulant",
    antiCardiolipin: "Anti-Cardiolipin IgG/IgM",
    antiBeta2Glycoprotein: "Anti-β2 Glycoprotein I IgG/IgM",
    phosphatidylserine: "Phosphatidylserine antibodies",
    antiParietalCell: "Anti-Parietal cell antibody",
    antiIntrinsicFactor:
      "Anti-Intrinsic factor antibody (Pernicious anemia)",
    antiEnterocyte: "Anti-Enterocyte antibody",
    antiSsaRoSjogren: "Anti-SSA/Ro",
    antiSsbLaSjogren: "Anti-SSB/La",
    schirmerTest: "Schirmer test (not antibody but part of evaluation)",
    anaSjogren: "ANA",
    rheumatoidFactorSjogren: "Rheumatoid Factor",
    antiJo1Myositis: "Anti-Jo-1",
    antiMi2Myositis: "Anti-Mi-2",
    antiSrpMyositis: "Anti-SRP",
    antiPl7Myositis: "Anti-PL-7",
    antiPl12Myositis: "Anti-PL-12",
    antiMda5Myositis: "Anti-MDA-5",
    antiTif1GammaMyositis: "Anti-TIF1-γ",
    antiHmgcr: "Anti-HMGCR",
    antiOvarian: "Anti-Ovarian antibody",
    antiZonaPelucida: "Anti-Zona pellucida antibody",
    antiSperm: "Anti-Sperm antibody",
    amh: "Anti-Müllerian Hormone (AMH)",
    c3: "C3",
    c4: "C4",
    ch50: "CH50 (Total complement activity)",
    antiCarp: "Anti-CarP (Carbamylated protein antibody)",
    esr: "ESR",
    crp: "CRP",
    lkm1: "LKM-1 antibody",
    slaLp: "SLA/LP antibody",
    pAnca: "p-ANCA (Myeloperoxidase or MPO Ab)",
    antiAchr:
      "Anti-AChR (Acetylcholine receptor) – Myasthenia gravis",
    antiMusk: "Anti-MuSK",
    antiGad65: "Anti-GAD65",
    antiNmda: "Anti-NMDA receptor Ab",
    gad65: "GAD65 antibody",
    ia2: "IA-2 antibody",
    znt8: "ZnT8 antibody",
    complementKidney: "Complement (C3/C4)",
  },
  cardiology: {
    ecgReport: "ECG — Report",
    echocardiogramType: "Echocardiogram — Type",
    echocardiogramReport: "Echocardiogram — Report",
    ettReport: "ETT — Report",
    totalCholesterol: "Total Cholesterol",
    totalCholesterolMmol: "Total Cholesterol (mmol/L)",
    triglycerides: "Triglycerides",
    triglyceridesMmol: "Triglycerides (mmol/L)",
    ldl: "LDL Cholesterol",
    ldlMmol: "LDL Cholesterol (mmol/L)",
    hdl: "HDL Cholesterol",
    hdlMmol: "HDL Cholesterol (mmol/L)",
    vldl: "VLDL Cholesterol",
    vldlMmol: "VLDL Cholesterol (mmol/L)",
    tcHdlRatio: "TC / HDL ratio",
    lpPla2: "Lp-PLA2",
    tropI: "Troponin I",
    highSensitiveTropI: "High-sensitivity Troponin I (hs-Trop I)",
    ckMb: "CK-MB",
    angiogram: "Angiogram",
    tiltTableTest: "Tilt table test",
  },
  hematology: {
    rbc: "RBC",
    hemoglobin: "Hb / Hgb",
    hct: "Hct",
    mcv: "MCV",
    mch: "MCH",
    mchc: "MCHC",
    rdw: "RDW",
    wbc: "WBC",
    immatureGranulocytes: "Immature Granulocytes",
    nrbc: "nRBC",
    plt: "PLT",
    mpv: "MPV",
    pdw: "PDW",
    pct: "PCT",
    esr: "ESR",
    ptPatient: "Prothrombin Time - Patient",
    ptTest: "Prothrombin Time - Test",
    inr: "INR",
    aptt: "APTT",
    dDimer: "D-dimer",
    bleedingTime: "Bleeding Time",
    clottingTime: "Clotting Time",
    reticulocyteCount: "Reticulocyte count",
    pbf: "PBF",
    ldh: "LDH",
    serumIron: "S. Iron / S. Fe",
    tibc: "TIBC",
    ferritin: "S. Ferritin",
    tsat: "TSAT",
    boneMarrowStudy: "Bone Marrow Study",
    b12: "S. B12 level",
    folate: "S. Folate",
  },
  basdai: {
    q1Fatigue: "Fatigue/tiredness",
    q2SpinalPain: "AS neck/back/hip pain",
    q3JointPain: "Pain/swelling in joints",
    q4TenderAreas: "Tender areas discomfort",
    q5MorningStiffness: "Morning stiffness severity",
    q6StiffnessDuration: "Morning stiffness duration",
    q6Label: "Duration label",
    basdaiScore: "BASDAI Score",
  },
};


const unitMeta: Record<
  string,
  Record<string, { unit?: string; unit1?: string; unit2?: string }>
> = {
  rft: {
    creatinine: { unit1: "mg/dL", unit2: "µmol/L" },
    sodium: { unit1: "mmol/L", unit2: "mEq/L" },
    potassium: { unit1: "mmol/L", unit2: "mEq/L" },
    chloride: { unit1: "mmol/L", unit2: "mEq/L" },
    bicarbonate: { unit1: "mmol/L", unit2: "mEq/L" },
    bun: { unit: "mg/dL" },
  },
  lft: {
    alt: { unit: "U/L" },
    ast: { unit: "U/L" },
    alp: { unit: "U/L" },
    ggt: { unit: "U/L" },
    bilirubinTotal: { unit1: "µmol/L", unit2: "mg/dL" },
    bilirubinDirect: { unit1: "µmol/L", unit2: "mg/dL" },
    bilirubinIndirect: { unit1: "µmol/L", unit2: "mg/dL" },
    albumin: { unit1: "g/L", unit2: "g/dL" },
    globulin: { unit1: "g/L", unit2: "g/dL" },
    ptPatient: { unit: "sec" },
    ptTest: { unit: "sec" },
    inr: { unit: "" },
    hbvDna: { unit1: "C/mL", unit2: "IU/mL" },
    hcvRna: { unit1: "C/mL", unit2: "IU/mL" },
    ggtValue: { unit: "U/L" },
  },
  hematology: {
    rbc: { unit: "million/µL" },
    hemoglobin: { unit: "g/dL" },
    hct: { unit: "%" },
    mcv: { unit: "fL" },
    mch: { unit: "pg" },
    mchc: { unit: "g/dL" },
    rdw: { unit: "%" },
    wbc: { unit: "cells/µL" },
    neutrophils: { unit1: "%", unit2: "cells/µL" },
    lymphocytes: { unit1: "%", unit2: "cells/µL" },
    monocytes: { unit1: "%", unit2: "cells/µL" },
    eosinophils: { unit1: "%", unit2: "cells/µL" },
    basophils: { unit1: "%", unit2: "cells/µL" },
    immatureGranulocytes: { unit: "%" },
    nrbc: { unit: "cells/100 WBC" },
    plt: { unit: "/µL" },
    mpv: { unit: "fL" },
    pdw: { unit: "fL" },
    pct: { unit: "%" },
    esr: { unit: "mm/hr" },
    ptPatient: { unit: "sec" },
    ptTest: { unit: "sec" },
    inr: { unit: "" },
    aptt: { unit: "sec" },
    fibrinogen: { unit1: "g/L", unit2: "mg/dL" },
    dDimer: { unit: "ng/mL" },
    bleedingTime: { unit: "sec" },
    clottingTime: { unit: "sec" },
    reticulocyteCount: { unit: "%" },
    ldh: { unit: "U/L" },
    serumIron: { unit1: "µmol/L", unit2: "µg/dL" },
    tibc: { unit: "µg/L" },
    tsat: { unit: "%" },
    ferritin: { unit: "ng/mL" },
    b12: { unit: "µg/L" },
    folate: { unit1: "µg/L", unit2: "ng/mL" },
  },
  diseaseHistory: {
    weightKg: { unit: "kg" },
    weightLb: { unit: "lb" },
    sbp: { unit: "mmHg" },
    dbp: { unit: "mmHg" },
    map: { unit: "mmHg" },
    pulse: { unit: "bpm" },
    respiratoryRate: { unit: "breaths/min" },
    spO2: { unit: "%" },
  },
  cardiology: {
    totalCholesterol: { unit: "mg/dL" },
    totalCholesterolMmol: { unit: "mmol/L" },
    triglycerides: { unit: "mg/dL" },
    triglyceridesMmol: { unit: "mmol/L" },
    ldl: { unit: "mg/dL" },
    ldlMmol: { unit: "mmol/L" },
    hdl: { unit: "mg/dL" },
    hdlMmol: { unit: "mmol/L" },
    vldl: { unit: "mg/dL" },
    vldlMmol: { unit: "mmol/L" },
    tcHdlRatio: { unit: "" },
    lpPla2: { unit: "nmol/min/mL" },
    tropI: { unit: "ng/mL" },
    highSensitiveTropI: { unit: "ng/L" },
    ckMb: { unit: "ng/mL" },
  },
  autoimmunoProfile: {},
  imaging: {},
  basdai: {},
};

function getFieldLabel(key: string, reportType: string): string {
  const reportLabels = fieldLabels[reportType];
  if (reportLabels && reportLabels[key]) {
    return reportLabels[key];
  }

  
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function formatTestData(
  data: unknown,
  reportType: string,
): { label: string; value: string }[] {
  if (!data || typeof data !== "object") return [];

  const formatted: { label: string; value: string }[] = [];
  const units = unitMeta[reportType] || {};

  
  if (Array.isArray(data)) {
    return [];
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;

    let displayValue = "";
    const label = getFieldLabel(key, reportType);

    
    if (typeof value === "object" && value !== null) {
      
      if ("value" in value || "value1" in value || "value2" in value) {
        const parts: string[] = [];
        const val = value as Record<string, unknown>;
        const meta = units[key];

        if ("value" in val && val.value) {
          const u = meta?.unit ? ` ${meta.unit}` : "";
          parts.push(`${val.value}${u}`);
        }
        if ("value1" in val && val.value1) {
          const u1 = meta?.unit1 ? ` ${meta.unit1}` : "";
          parts.push(`${val.value1}${u1}`);
        }
        if ("value2" in val && val.value2) {
          const u2 = meta?.unit2 ? ` ${meta.unit2}` : "";
          parts.push(`${val.value2}${u2}`);
        }
        if ("notes" in val && val.notes)
          parts.push(`Notes: ${String(val.notes)}`);
        displayValue = parts.join(" / ");
      } else {
        
        const objEntries = Object.entries(value).filter(
          ([, v]) => v !== null && v !== undefined && v !== "",
        );
        if (objEntries.length > 0) {
          displayValue = objEntries.map(([k, v]) => `${k}: ${v}`).join(", ");
        }
      }
    } else {
      const unit = units[key]?.unit;
      displayValue = `${String(value)}${unit ? ` ${unit}` : ""}`;
    }

    if (displayValue.trim()) {
      formatted.push({ label, value: displayValue });
    }
  });

  return formatted;
}
