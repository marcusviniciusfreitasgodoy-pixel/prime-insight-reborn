/**
 * Bidirectional street name normalizer
 * Converts between official Prefeitura names and ITBI abbreviated names
 */

// Mapping from abbreviation to full name
const ABBREVIATION_TO_FULL: Record<string, string> = {
  "AVN": "AVENIDA",
  "AV": "AVENIDA",
  "R": "RUA",
  "PR": "PRACA",
  "PCA": "PRACA",
  "PRC": "PRACA",
  "TRV": "TRAVESSA",
  "TV": "TRAVESSA",
  "EST": "ESTRADA",
  "AL": "ALAMEDA",
  "LGO": "LARGO",
  "BC": "BECO",
  "LD": "LADEIRA",
  "VL": "VILA",
  "GAL": "GENERAL",
  "CEL": "CORONEL",
  "DR": "DOUTOR",
  "DESEN": "DESEMBARGADOR",
  "DES": "DESEMBARGADOR",
  "COMTE": "COMANDANTE",
  "EMBAIX": "EMBAIXADOR",
  "EMB": "EMBAIXADOR",
  "JORN": "JORNALISTA",
  "SEN": "SENADOR",
  "DEP": "DEPUTADO",
  "PRES": "PRESIDENTE",
  "CAP": "CAPITAO",
  "MAJ": "MAJOR",
  "TEN": "TENENTE",
  "SGT": "SARGENTO",
  "ALM": "ALMIRANTE",
  "ALMTE": "ALMIRANTE",
  "PROF": "PROFESSOR",
  "ENG": "ENGENHEIRO",
  "ARQ": "ARQUITETO",
  "MIN": "MINISTRO",
  "GOV": "GOVERNADOR",
  "PREF": "PREFEITO",
  "VER": "VEREADOR",
  "MAL": "MARECHAL",
  "COM": "COMENDADOR",
  "BRIG": "BRIGADEIRO",
  "PROC": "PROCURADOR",
  "CONS": "CONSELHEIRO",
};

// Create reverse mapping (full to abbreviation)
const FULL_TO_ABBREVIATION: Record<string, string> = {};
Object.entries(ABBREVIATION_TO_FULL).forEach(([abbr, full]) => {
  // Use the shortest abbreviation for each full name
  if (!FULL_TO_ABBREVIATION[full] || abbr.length < FULL_TO_ABBREVIATION[full].length) {
    FULL_TO_ABBREVIATION[full] = abbr;
  }
});

// Override with most common ITBI abbreviations
FULL_TO_ABBREVIATION["AVENIDA"] = "AVN";
FULL_TO_ABBREVIATION["PRACA"] = "PRC";
FULL_TO_ABBREVIATION["TRAVESSA"] = "TRV";
FULL_TO_ABBREVIATION["DESEMBARGADOR"] = "DESEN";
FULL_TO_ABBREVIATION["COMANDANTE"] = "COMTE";
FULL_TO_ABBREVIATION["EMBAIXADOR"] = "EMBAIX";
FULL_TO_ABBREVIATION["ALMIRANTE"] = "ALMTE";

/**
 * Expand abbreviations to full names (ITBI -> Official)
 */
export function expandAbbreviations(name: string): string {
  const words = name.toUpperCase().trim().split(/\s+/);
  return words.map(word => ABBREVIATION_TO_FULL[word] || word).join(" ");
}

/**
 * Contract full names to abbreviations (Official -> ITBI)
 */
export function contractToAbbreviations(name: string): string {
  const words = name.toUpperCase().trim().split(/\s+/);
  return words.map(word => FULL_TO_ABBREVIATION[word] || word).join(" ");
}

/**
 * Generate all possible variations of a street name
 * Returns both abbreviated and expanded versions
 */
export function generateNameVariations(name: string): string[] {
  const upper = name.toUpperCase().trim();
  const variations = new Set<string>();
  
  variations.add(upper);
  
  // Add expanded version
  const expanded = expandAbbreviations(upper);
  variations.add(expanded);
  
  // Add contracted version
  const contracted = contractToAbbreviations(upper);
  variations.add(contracted);
  
  // Also try expanding the contracted version (in case of mixed input)
  variations.add(expandAbbreviations(contracted));
  
  return Array.from(variations);
}

/**
 * Check if two street names are equivalent
 */
export function areStreetsEquivalent(name1: string, name2: string): boolean {
  const variations1 = generateNameVariations(name1);
  const variations2 = generateNameVariations(name2);
  
  return variations1.some(v1 => variations2.includes(v1));
}

/**
 * Find the best match for a street name in a list
 */
export function findBestMatch(searchName: string, candidates: string[]): string | null {
  const searchVariations = generateNameVariations(searchName);
  
  // First try exact match with any variation
  for (const variation of searchVariations) {
    const exactMatch = candidates.find(c => c.toUpperCase() === variation);
    if (exactMatch) return exactMatch;
  }
  
  // Then try partial match
  for (const variation of searchVariations) {
    const partialMatch = candidates.find(c => 
      c.toUpperCase().includes(variation) || variation.includes(c.toUpperCase())
    );
    if (partialMatch) return partialMatch;
  }
  
  return null;
}

/**
 * Normalize a street name for consistent storage/comparison
 * Removes accents and converts to uppercase
 */
export function normalizeStreetName(name: string): string {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}
