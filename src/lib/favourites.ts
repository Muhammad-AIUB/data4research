// Utility functions for managing field-level favourites

export interface FavouriteField {
  reportType: string
  reportName: string
  fieldName: string
  fieldLabel: string
  sectionTitle?: string  // Section title like "ANA PROFILE (Anti-Nuclear Antibody Panel)"
  createdAt: string
}

const FAVOURITES_KEY = 'data4research_favourites'

export function getFavourites(): FavouriteField[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(FAVOURITES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addFavouriteField(
  reportType: string,
  reportName: string,
  fieldName: string,
  fieldLabel: string,
  sectionTitle?: string
): void {
  if (typeof window === 'undefined') return
  const favourites = getFavourites()
  
  // Check if already exists
  const exists = favourites.find(
    f => f.reportType === reportType && f.fieldName === fieldName
  )
  
  if (!exists) {
    const newFavourite: FavouriteField = {
      reportType,
      reportName,
      fieldName,
      fieldLabel,
      sectionTitle,
      createdAt: new Date().toISOString()
    }
    favourites.push(newFavourite)
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites))
  } else if (sectionTitle) {
    // Update sectionTitle if field already exists
    const index = favourites.findIndex(
      f => f.reportType === reportType && f.fieldName === fieldName
    )
    if (index !== -1) {
      favourites[index].sectionTitle = sectionTitle
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites))
    }
  }
}

export function removeFavouriteField(reportType: string, fieldName: string): void {
  if (typeof window === 'undefined') return
  const favourites = getFavourites()
  const filtered = favourites.filter(
    f => !(f.reportType === reportType && f.fieldName === fieldName)
  )
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(filtered))
  // Also remove the associated value
  removeFavouriteFieldValue(reportType, fieldName)
}

export function isFieldFavourite(reportType: string, fieldName: string): boolean {
  if (typeof window === 'undefined') return false
  const favourites = getFavourites()
  return favourites.some(
    f => f.reportType === reportType && f.fieldName === fieldName
  )
}

export function getFavouritesByReport(reportType: string): FavouriteField[] {
  if (typeof window === 'undefined') return []
  const favourites = getFavourites()
  return favourites.filter(f => f.reportType === reportType)
}

export function getAllFavouritesGrouped(): Record<string, FavouriteField[]> {
  if (typeof window === 'undefined') return {}
  const favourites = getFavourites()
  return favourites.reduce((acc, fav) => {
    if (!acc[fav.reportType]) {
      acc[fav.reportType] = []
    }
    acc[fav.reportType].push(fav)
    return acc
  }, {} as Record<string, FavouriteField[]>)
}

// Bulk add all fields in a section to favorites
export function addSectionFieldsToFavourites(
  reportType: string,
  reportName: string,
  fields: Array<[string, string]>, // Array of [fieldName, fieldLabel]
  sectionTitle?: string
): void {
  if (typeof window === 'undefined') return
  fields.forEach(([fieldName, fieldLabel]) => {
    addFavouriteField(reportType, reportName, fieldName, fieldLabel, sectionTitle)
  })
}

// Bulk remove all fields in a section from favorites
export function removeSectionFieldsFromFavourites(
  reportType: string,
  fields: Array<[string, string]> // Array of [fieldName, fieldLabel]
): void {
  if (typeof window === 'undefined') return
  fields.forEach(([fieldName]) => {
    removeFavouriteField(reportType, fieldName)
  })
}

// Check if all fields in a section are favorites
export function areAllSectionFieldsFavourite(
  reportType: string,
  fields: Array<[string, string]>
): boolean {
  if (typeof window === 'undefined') return false
  if (fields.length === 0) return false
  return fields.every(([fieldName]) => isFieldFavourite(reportType, fieldName))
}

// Check if any fields in a section are favorites
export function areAnySectionFieldsFavourite(
  reportType: string,
  fields: Array<[string, string]>
): boolean {
  if (typeof window === 'undefined') return false
  return fields.some(([fieldName]) => isFieldFavourite(reportType, fieldName))
}

// Store favorite field value
const FAVOURITE_VALUES_KEY = 'data4research_favourite_values'

export function setFavouriteFieldValue(
  reportType: string,
  fieldName: string,
  value: string
): void {
  if (typeof window === 'undefined') return
  const key = `${reportType}:${fieldName}`
  const values = getFavouriteFieldValues()
  values[key] = value
  localStorage.setItem(FAVOURITE_VALUES_KEY, JSON.stringify(values))
}

export function getFavouriteFieldValue(
  reportType: string,
  fieldName: string
): string {
  if (typeof window === 'undefined') return ''
  const key = `${reportType}:${fieldName}`
  const values = getFavouriteFieldValues()
  return values[key] || ''
}

export function getFavouriteFieldValues(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem(FAVOURITE_VALUES_KEY)
  return stored ? JSON.parse(stored) : {}
}

export function removeFavouriteFieldValue(
  reportType: string,
  fieldName: string
): void {
  if (typeof window === 'undefined') return
  const key = `${reportType}:${fieldName}`
  const values = getFavouriteFieldValues()
  delete values[key]
  localStorage.setItem(FAVOURITE_VALUES_KEY, JSON.stringify(values))
}