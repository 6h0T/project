// Utilidades para filtros de servidores

export interface ServerItem {
  id: number | string;
  name?: string;
  title?: string;
  description?: string;
  country?: string;
  chronicle?: string;
  version?: string;
  serverType?: string;
  isPremium?: boolean;
  [key: string]: any;
}

// Extraer países únicos de una lista de servidores
export function extractUniqueCountries(servers: ServerItem[]): string[] {
  const countries = new Set<string>();
  
  servers.forEach(server => {
    if (server.country && server.country.trim() !== '') {
      countries.add(server.country.trim());
    }
  });
  
  return Array.from(countries).sort();
}

// Extraer crónicas/versiones únicas de una lista de servidores
export function extractUniqueChronicles(servers: ServerItem[]): string[] {
  const chronicles = new Set<string>();
  
  servers.forEach(server => {
    // Intentar obtener chronicle o version
    const chronicle = server.chronicle || server.version;
    if (chronicle && chronicle.trim() !== '') {
      chronicles.add(chronicle.trim());
    }
  });
  
  return Array.from(chronicles).sort();
}

// Filtrar servidores por término de búsqueda
export function filterServersBySearch(servers: ServerItem[], searchTerm: string): ServerItem[] {
  if (!searchTerm.trim()) return servers;
  
  const term = searchTerm.toLowerCase();
  return servers.filter(server => 
    server.title?.toLowerCase().includes(term) ||
    server.name?.toLowerCase().includes(term) ||
    server.description?.toLowerCase().includes(term) ||
    server.country?.toLowerCase().includes(term) ||
    server.chronicle?.toLowerCase().includes(term) ||
    server.version?.toLowerCase().includes(term) ||
    server.serverType?.toLowerCase().includes(term)
  );
}

// Filtrar servidores por país
export function filterServersByCountry(servers: ServerItem[], country: string): ServerItem[] {
  if (!country.trim()) return servers;
  
  return servers.filter(server => 
    server.country === country
  );
}

// Filtrar servidores por crónica/versión
export function filterServersByChronicle(servers: ServerItem[], chronicle: string): ServerItem[] {
  if (!chronicle.trim()) return servers;
  
  return servers.filter(server => 
    server.chronicle === chronicle || server.version === chronicle
  );
}

// Aplicar todos los filtros de una vez
export function applyAllFilters(
  servers: ServerItem[], 
  searchTerm: string = '', 
  country: string = '', 
  chronicle: string = ''
): ServerItem[] {
  let filteredServers = servers;
  
  // Aplicar filtro de búsqueda
  if (searchTerm.trim()) {
    filteredServers = filterServersBySearch(filteredServers, searchTerm);
  }
  
  // Aplicar filtro de país
  if (country.trim()) {
    filteredServers = filterServersByCountry(filteredServers, country);
  }
  
  // Aplicar filtro de crónica
  if (chronicle.trim()) {
    filteredServers = filterServersByChronicle(filteredServers, chronicle);
  }
  
  return filteredServers;
}

// Obtener estadísticas de filtros aplicados
export interface FilterStats {
  totalServers: number;
  filteredServers: number;
  premiumCount: number;
  normalCount: number;
  appliedFilters: {
    search: boolean;
    country: boolean;
    chronicle: boolean;
  };
}

export function getFilterStats(
  originalServers: ServerItem[],
  filteredServers: ServerItem[],
  searchTerm: string = '',
  country: string = '',
  chronicle: string = ''
): FilterStats {
  const premiumCount = filteredServers.filter(s => s.isPremium).length;
  const normalCount = filteredServers.length - premiumCount;

  return {
    totalServers: originalServers.length,
    filteredServers: filteredServers.length,
    premiumCount,
    normalCount,
    appliedFilters: {
      search: searchTerm.trim() !== '',
      country: country.trim() !== '',
      chronicle: chronicle.trim() !== ''
    }
  };
} 