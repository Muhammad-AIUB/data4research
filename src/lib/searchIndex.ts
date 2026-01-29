type SearchItem = { key: string; label: string; modal: string }


export const searchIndex: SearchItem[] = [
  
  { key: 'rbc', label: 'RBC (Red Blood Cells)', modal: 'hematology' },
  { key: 'hemoglobin', label: 'Hemoglobin (Hb / Hgb)', modal: 'hematology' },
  { key: 'hct', label: 'Hct', modal: 'hematology' },
  { key: 'mcv', label: 'MCV', modal: 'hematology' },
  { key: 'mch', label: 'MCH', modal: 'hematology' },
  { key: 'mchc', label: 'MCHC', modal: 'hematology' },
  { key: 'rdw', label: 'RDW', modal: 'hematology' },
  { key: 'wbc', label: 'WBC (White Blood Cells)', modal: 'hematology' },
  { key: 'neutrophils', label: 'Neutrophils', modal: 'hematology' },
  { key: 'lymphocytes', label: 'Lymphocytes', modal: 'hematology' },
  { key: 'monocytes', label: 'Monocytes', modal: 'hematology' },
  { key: 'eosinophils', label: 'Eosinophils', modal: 'hematology' },
  { key: 'basophils', label: 'Basophils', modal: 'hematology' },
  { key: 'plt', label: 'Platelets (PLT)', modal: 'hematology' },
  { key: 'mpv', label: 'MPV', modal: 'hematology' },
  { key: 'esr', label: 'ESR', modal: 'hematology' },

  
  { key: 'pt', label: 'Prothrombin Time (PT)', modal: 'hematology' },
  { key: 'inr', label: 'INR', modal: 'hematology' },
  { key: 'aptt', label: 'APTT', modal: 'hematology' },

  
  { key: 'creatinine', label: 'Creatinine', modal: 'rft' },
  { key: 'bun', label: 'BUN', modal: 'rft' },
  { key: 'sodium', label: 'Sodium (Na+)', modal: 'rft' },
  { key: 'potassium', label: 'Potassium (K+)', modal: 'rft' },
  { key: 'chloride', label: 'Chloride (Cl-)', modal: 'rft' },
  { key: 'bicarbonate', label: 'Bicarbonate (HCO3-)', modal: 'rft' },

  
  { key: 'alt', label: 'ALT (SGPT)', modal: 'lft' },
  { key: 'ast', label: 'AST (SGOT)', modal: 'lft' },
  { key: 'alkphos', label: 'Alkaline Phosphatase', modal: 'lft' },
  { key: 'bilirubin', label: 'Bilirubin', modal: 'lft' },

  
  { key: 'ecg', label: 'ECG / Cardiology', modal: 'cardiology' },
  { key: 'troponin', label: 'Troponin', modal: 'cardiology' },

  
  { key: 'ana', label: 'ANA (Anti-Nuclear Antibody)', modal: 'autoimmuno' },
  { key: 'anti-dsDNA', label: 'Anti-dsDNA', modal: 'autoimmuno' },
  { key: 'anti-sm', label: 'Anti-Sm', modal: 'autoimmuno' },
  { key: 'anti-ssa', label: 'Anti-SSA (Ro60)', modal: 'autoimmuno' },
  { key: 'anti-ssb', label: 'Anti-SSB (La)', modal: 'autoimmuno' },

  
  { key: 'imaging', label: 'Imaging / Histopathology', modal: 'imaging' },

  
  { key: 'disease', label: 'Disease History', modal: 'disease-history' },
  { key: 'favorites', label: 'My Favorites', modal: 'my-favorites' },
  
  
  { key: 'basdai', label: 'BASDAI Score', modal: 'basdai' },
  { key: 'fatigue', label: 'Fatigue/tiredness (BASDAI)', modal: 'basdai' },
  { key: 'morning stiffness', label: 'Morning stiffness (BASDAI)', modal: 'basdai' },
]

export default searchIndex
