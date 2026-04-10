export const COUNTRY_CODES = [
  'DE', 'AT', 'CH', 'US', 'GB', 'AU', 'FR', 'ES', 'IT', 'NL',
  'BE', 'DK', 'SE', 'NO', 'PL', 'CA', 'IE', 'OTHER'
]

// Placeholder format per country
export const ADDRESS_PLACEHOLDERS = {
  DE: 'Musterstraße 12\n80331 München',
  AT: 'Musterstraße 12\n1010 Wien',
  CH: 'Musterstrasse 12\n8001 Zürich',
  US: '123 Main Street\nApt 4\nNew York, NY 10001',
  GB: '10 Downing Street\nLondon SW1A 2AA',
  AU: '12 George Street\nSydney NSW 2000',
  FR: '12 rue de Rivoli\n75001 Paris',
  ES: 'Calle Mayor 12\n28013 Madrid',
  IT: 'Via Roma 12\n00100 Roma RM',
  NL: 'Damrak 12\n1012 LP Amsterdam',
  BE: 'Rue Neuve 12\n1000 Bruxelles',
  DK: 'Strøget 12\n1200 København',
  SE: 'Drottninggatan 12\n111 51 Stockholm',
  NO: 'Karl Johans gate 12\n0154 Oslo',
  PL: 'ul. Marszałkowska 12\n00-001 Warszawa',
  CA: '123 Main Street\nToronto, ON M5H 2N2',
  IE: '12 O\'Connell Street\nDublin D01',
  OTHER: 'Full address'
}

// Combine legacy fields (street, plz, city) into single address string
export function formatLegacyAddress(obj) {
  const parts = []
  if (obj.address) parts.push(obj.address)
  const line2 = [obj.plz, obj.city].filter(Boolean).join(' ')
  if (line2) parts.push(line2)
  return parts.join('\n')
}

// Get combined display address from either new or legacy format
export function getDisplayAddress(obj) {
  if (!obj) return ''
  // New format: obj.address is already a multiline string, plus optional country
  if (obj.address && !obj.plz && !obj.city) return obj.address
  // Legacy format
  return formatLegacyAddress(obj)
}
