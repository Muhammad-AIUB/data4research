// Utility functions for managing field-level favourites

export interface FavouriteField {
  reportType: string
  reportName: string
  fieldName: string
  fieldLabel: string
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
  fieldLabel: string
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
      createdAt: new Date().toISOString()
    }
    favourites.push(newFavourite)
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites))
  }
}

export function removeFavouriteField(reportType: string, fieldName: string): void {
  if (typeof window === 'undefined') return
  const favourites = getFavourites()
  const filtered = favourites.filter(
    f => !(f.reportType === reportType && f.fieldName === fieldName)
  )
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(filtered))
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
