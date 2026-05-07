const SECTION_TITLES = [
  'Introdução',
  'Justificativa',
  'Objetivos',
  'Metodologia',
  'Cronograma',
  'Orçamento',
];

/**
 * @param {string} texto
 * @returns {Array<{ titulo: string, conteudo: string }>}
 */
export function parseProjetoSections(texto) {
  if (!texto || typeof texto !== 'string') return [];

  // Match titles only at the start of a line (with optional ## prefix)
  const titlePattern = (title) =>
    new RegExp(`(?:^|\\n)(?:#{1,3}\\s*)?${title}\\s*\\n`, 'i');

  // Find the position of each title in the text (matchStart = before title line, start = after title line)
  const positions = [];
  for (const title of SECTION_TITLES) {
    const match = titlePattern(title).exec(texto);
    if (!match) continue;
    positions.push({ titulo: title, matchStart: match.index, start: match.index + match[0].length });
  }

  // Sort by order of appearance
  positions.sort((a, b) => a.matchStart - b.matchStart);

  // Extract content between consecutive titles
  const result = positions.map(({ titulo, start }, i) => {
    const end = i + 1 < positions.length ? positions[i + 1].matchStart : texto.length;
    const conteudo = texto.slice(start, end).trim();
    return { titulo, conteudo };
  });

  return result;
}