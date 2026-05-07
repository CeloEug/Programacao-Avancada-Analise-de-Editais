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

  const result = [];

  for (let i = 0; i < SECTION_TITLES.length; i++) {
    const title = SECTION_TITLES[i];
    const titleIndex = texto.indexOf(title);
    if (titleIndex === -1) continue;

    const contentStart = titleIndex + title.length;

    // Find where the next known section starts
    let contentEnd = texto.length;
    for (let j = 0; j < SECTION_TITLES.length; j++) {
      if (j === i) continue;
      const nextIndex = texto.indexOf(SECTION_TITLES[j], contentStart);
      if (nextIndex !== -1 && nextIndex < contentEnd) {
        contentEnd = nextIndex;
      }
    }

    const conteudo = texto.slice(contentStart, contentEnd).trim();
    result.push({ titulo: title, conteudo });
  }

  // Sort by order of appearance in the text
  result.sort((a, b) => texto.indexOf(a.titulo) - texto.indexOf(b.titulo));

  return result;
}