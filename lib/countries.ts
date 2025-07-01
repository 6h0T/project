// Mapeo de países con sus códigos ISO y nombres
export const countries = {
  'Spain': { code: 'es', name: 'España' },
  'International': { code: 'un', name: 'Internacional' },
  'English': { code: 'us', name: 'Estados Unidos' },
  'Brazil': { code: 'br', name: 'Brasil' },
  'Russia': { code: 'ru', name: 'Rusia' },
  'Germany': { code: 'de', name: 'Alemania' },
  'France': { code: 'fr', name: 'Francia' },
  'Italy': { code: 'it', name: 'Italia' },
  'Poland': { code: 'pl', name: 'Polonia' },
  'Turkey': { code: 'tr', name: 'Turquía' },
  'Greece': { code: 'gr', name: 'Grecia' },
  'Romania': { code: 'ro', name: 'Rumania' },
  'Ukraine': { code: 'ua', name: 'Ucrania' },
  'Czech Republic': { code: 'cz', name: 'República Checa' },
  'Hungary': { code: 'hu', name: 'Hungría' },
  'Portugal': { code: 'pt', name: 'Portugal' },
  'Netherlands': { code: 'nl', name: 'Países Bajos' },
  'Belgium': { code: 'be', name: 'Bélgica' },
  'Sweden': { code: 'se', name: 'Suecia' },
  'Norway': { code: 'no', name: 'Noruega' },
  'Denmark': { code: 'dk', name: 'Dinamarca' },
  'Finland': { code: 'fi', name: 'Finlandia' },
  'Canada': { code: 'ca', name: 'Canadá' },
  'Australia': { code: 'au', name: 'Australia' },
  'Japan': { code: 'jp', name: 'Japón' },
  'South Korea': { code: 'kr', name: 'Corea del Sur' },
  'China': { code: 'cn', name: 'China' },
  'Mexico': { code: 'mx', name: 'México' },
  'Argentina': { code: 'ar', name: 'Argentina' },
  'Chile': { code: 'cl', name: 'Chile' },
  'Colombia': { code: 'co', name: 'Colombia' },
  'Peru': { code: 'pe', name: 'Perú' },
  'Venezuela': { code: 've', name: 'Venezuela' },
  'Ecuador': { code: 'ec', name: 'Ecuador' },
  'Uruguay': { code: 'uy', name: 'Uruguay' },
  'Paraguay': { code: 'py', name: 'Paraguay' },
  'Bolivia': { code: 'bo', name: 'Bolivia' },
  'Costa Rica': { code: 'cr', name: 'Costa Rica' },
  'Panama': { code: 'pa', name: 'Panamá' },
  'Guatemala': { code: 'gt', name: 'Guatemala' },
  'Honduras': { code: 'hn', name: 'Honduras' },
  'El Salvador': { code: 'sv', name: 'El Salvador' },
  'Nicaragua': { code: 'ni', name: 'Nicaragua' },
  'Dominican Republic': { code: 'do', name: 'República Dominicana' },
  'Cuba': { code: 'cu', name: 'Cuba' },
  'Puerto Rico': { code: 'pr', name: 'Puerto Rico' },
  'Jamaica': { code: 'jm', name: 'Jamaica' },
  'Trinidad and Tobago': { code: 'tt', name: 'Trinidad y Tobago' },
  'Barbados': { code: 'bb', name: 'Barbados' },
  'Bahamas': { code: 'bs', name: 'Bahamas' },
  'Haiti': { code: 'ht', name: 'Haití' },
  'Belize': { code: 'bz', name: 'Belice' },
  'Guyana': { code: 'gy', name: 'Guyana' },
  'Suriname': { code: 'sr', name: 'Surinam' },
  'French Guiana': { code: 'gf', name: 'Guayana Francesa' },
} as const;

export type CountryKey = keyof typeof countries;

// Función para obtener el código de país
export function getCountryCode(countryName: string): string {
  const country = countries[countryName as CountryKey];
  return country?.code || 'un'; // 'un' para internacional/desconocido
}

// Función para obtener el nombre localizado
export function getCountryName(countryName: string): string {
  const country = countries[countryName as CountryKey];
  return country?.name || countryName;
}

// Lista de países más comunes para los filtros
export const popularCountries = [
  'International',
  'Spain',
  'English',
  'Brazil',
  'Russia',
  'Germany',
  'France',
  'Italy',
  'Poland',
  'Turkey',
  'Greece',
  'Romania',
] as const;