// Utility function to format test data for display

// Field labels mapping for all report types
const fieldLabels: Record<string, Record<string, string>> = {
  autoimmunoProfile: {
    'ana': 'ANA (IFA, ELISA, or multiplex)',
    'antiDsDna': 'Anti–dsDNA',
    'antiSm': 'Anti–Sm',
    'antiSsaRo60': 'Anti–SSA (Ro60)',
    'antiSsbLa': 'Anti–SSB (La)',
    'antiRnp': 'Anti–RNP',
    'antiScl70': 'Anti–Scl-70 (Topoisomerase I)',
    'antiCentromere': 'Anti–Centromere',
    'antiHistone': 'Anti–Histone',
    'antiNucleosome': 'Anti–Nucleosome',
    'antiChromatin': 'Anti–Chromatin',
    'antiRibosomalP': 'Anti–Ribosomal P',
    'antiPmScl': 'Anti–PM/Scl',
    'antiJo1': 'Anti–Jo-1 (myositis)',
    'antiSsaRo60Extended': 'Anti-SSA/Ro60',
    'antiRo52': 'Anti-Ro52',
    'antiSsbLaExtended': 'Anti-SSB/La',
    'antiSmExtended': 'Anti-Sm',
    'antiRnpExtended': 'Anti-RNP',
    'antiScl70Extended': 'Anti-Scl-70',
    'antiCentromereB': 'Anti-Centromere B',
    'antiJo1Extended': 'Anti-Jo-1',
    'antiMi2': 'Anti-Mi-2 (Dermatomyositis)',
    'antiTif1Gamma': 'Anti-TIF1-γ',
    'antiMda5': 'Anti-MDA-5',
    'antiSrp': 'Anti-SRP',
    'antiPl7': 'Anti-PL-7',
    'antiPl12': 'Anti-PL-12',
    'antiEj': 'Anti-EJ',
    'antiOj': 'Anti-OJ',
    'antiTpo': 'Anti-TPO (Thyroid peroxidase antibody)',
    'antiTg': 'Anti-Tg (Thyroglobulin antibody)',
    'trab': 'TRAb (TSH receptor antibody)',
    'tsi': 'TSI (Thyroid Stimulating Immunoglobulin)',
    'rheumatoidFactor': 'Rheumatoid Factor (RF)',
    'antiCcp': 'Anti-CCP (Anti-cyclic citrullinated peptide)',
    'anaRheumatoid': 'ANA',
    'esrRheumatoid': 'ESR',
    'crpRheumatoid': 'CRP',
    'hlaB27': 'HLA-B27 (for spondyloarthropathy)',
    'antiCarP': 'Anti-CarP (Carbamylated protein antibody)',
    'anaLiver': 'ANA',
    'asma': 'ASMA (Anti-Smooth Muscle Ab)',
    'lkm1Antibody': 'LKM-1 antibody',
    'slaLpAntibody': 'SLA/LP antibody',
    'ama': 'AMA (Anti-Mitochondrial Antibody)',
    'amaM2': 'AMA-M2 specifically for PBC',
    'pAncaLiver': 'p-ANCA (for PSC)',
    'cAnca': 'c-ANCA (Proteinase-3 or PR3 Ab)',
    'pAncaVasculitis': 'p-ANCA (Myeloperoxidase or MPO Ab)',
    'anaVasculitis': 'ANA',
    'antiGbm': 'Anti-GBM (Goodpasture syndrome)',
    'complementC3C4': 'Complement C3, C4',
    'antiAChR': 'Anti-AChR (Acetylcholine receptor) – Myasthenia gravis',
    'antiMuSK': 'Anti-MuSK',
    'antiVgkc': 'Anti-VGKC (voltage-gated potassium channel)',
    'antiGad65Neuro': 'Anti-GAD65',
    'antiNmdaReceptorAb': 'Anti-NMDA receptor Ab',
    'antiLgi1': 'Anti-LGI1',
    'antiCaspr2': 'Anti-CASPR2',
    'antiAquaporin4': 'Anti-Aquaporin-4 (NMO)',
    'antiMog': 'Anti-MOG (Myelin oligodendrocyte glycoprotein)',
    'antiTtgIga': 'Anti-tTG IgA',
    'antiTtgIgg': 'Anti-tTG IgG',
    'antiEma': 'Anti-EMA (Endomysial Ab)',
    'antiDgp': 'Anti-DGP (Deamidated gliadin peptide)',
    'totalIga': 'Total IgA (to rule out IgA deficiency)',
    'gad65Antibody': 'GAD65 antibody',
    'ia2Antibody': 'IA-2 antibody',
    'znt8Antibody': 'ZnT8 antibody',
    'ica': 'ICA (Islet cell Ab)',
    'iaa': 'IAA (Insulin autoantibody)',
    'anaKidney': 'ANA',
    'ancaKidney': 'ANCA (p-ANCA, c-ANCA)',
    'antiGbmKidney': 'Anti-GBM',
    'complementC3C4Kidney': 'Complement (C3/C4)',
    'antiPla2r': 'Anti-PLA2R (Membranous nephropathy)',
    'antiThsd7a': 'Anti-THSD7A',
    'antiDesmoglein1': 'Anti-Desmoglein 1',
    'antiDesmoglein3': 'Anti-Desmoglein 3',
    'antiBp180': 'Anti-BP180 (Collagen XVII)',
    'antiBp230': 'Anti-BP230',
  },
  // Add more report types as needed
}

function getFieldLabel(key: string, reportType: string): string {
  const reportLabels = fieldLabels[reportType]
  if (reportLabels && reportLabels[key]) {
    return reportLabels[key]
  }
  
  // Fallback: convert camelCase to readable format
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export function formatTestData(data: any, reportType: string): { label: string; value: string }[] {
  if (!data || typeof data !== 'object') return []
  
  const formatted: { label: string; value: string }[] = []
  
  // Handle different data structures
  if (Array.isArray(data)) {
    return []
  }
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    
    let displayValue = ''
    const label = getFieldLabel(key, reportType)
    
    // Handle different value types
    if (typeof value === 'object' && value !== null) {
      // Handle { value: "...", notes: "..." } structure
      if ('value' in value || 'value1' in value || 'value2' in value) {
        const parts: string[] = []
        const val = value as Record<string, unknown>
        if ('value' in val && val.value) parts.push(String(val.value))
        if ('value1' in val && val.value1) {
          if ('value2' in val && val.value2) {
            parts.push(`${val.value1} / ${val.value2}`)
          } else {
            parts.push(String(val.value1))
          }
        } else if ('value2' in val && val.value2) {
          parts.push(String(val.value2))
        }
        if ('notes' in val && val.notes) parts.push(`Notes: ${String(val.notes)}`)
        displayValue = parts.join(' | ')
      } else {
        // For other object types, try to format nicely
        const objEntries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        if (objEntries.length > 0) {
          displayValue = objEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
        }
      }
    } else {
      displayValue = String(value)
    }
    
    if (displayValue.trim()) {
      formatted.push({ label, value: displayValue })
    }
  })
  
  return formatted
}

