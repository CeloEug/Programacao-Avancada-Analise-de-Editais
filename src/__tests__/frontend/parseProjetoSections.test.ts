import { describe, it, expect } from 'vitest';
import { parseProjetoSections } from '../../../public/parse-projeto.js';

const FULL_TEXT = `
Introdução
Este projeto visa resolver o problema X.

Justificativa
O problema X afeta milhões de pesquisadores.

Objetivos
Desenvolver uma plataforma de apoio.

Metodologia
Serão realizadas entrevistas e sprints de desenvolvimento.

Cronograma
Mês 1: levantamento de requisitos. Mês 2: desenvolvimento.

Orçamento
R$ 50.000 distribuídos em pessoal e infraestrutura.
`.trim();

describe('parseProjetoSections', () => {
  it('retorna 6 seções quando o texto contém todas', () => {
    const sections = parseProjetoSections(FULL_TEXT);
    expect(sections).toHaveLength(6);
    expect(sections.map((s) => s.titulo)).toEqual([
      'Introdução',
      'Justificativa',
      'Objetivos',
      'Metodologia',
      'Cronograma',
      'Orçamento',
    ]);
  });

  it('extrai o conteúdo correto de cada seção', () => {
    const sections = parseProjetoSections(FULL_TEXT);
    const introducao = sections.find((s) => s.titulo === 'Introdução');
    expect(introducao?.conteudo).toBe('Este projeto visa resolver o problema X.');
  });

  it('retorna array vazio para texto vazio', () => {
    expect(parseProjetoSections('')).toEqual([]);
  });

  it('retorna array vazio para valor nulo/undefined', () => {
    expect(parseProjetoSections(null as unknown as string)).toEqual([]);
    expect(parseProjetoSections(undefined as unknown as string)).toEqual([]);
  });

  it('retorna apenas as seções presentes quando algumas estão ausentes', () => {
    const parcial = 'Introdução\nTexto intro.\n\nObjetivos\nTexto objetivos.';
    const sections = parseProjetoSections(parcial);
    expect(sections).toHaveLength(2);
    expect(sections[0].titulo).toBe('Introdução');
    expect(sections[1].titulo).toBe('Objetivos');
  });

  it('retorna conteúdo vazio para seção sem texto', () => {
    const text = 'Introdução\n\nJustificativa\nTexto aqui.';
    const sections = parseProjetoSections(text);
    const introducao = sections.find((s) => s.titulo === 'Introdução');
    expect(introducao?.conteudo).toBe('');
  });

  it('preserva conteúdo com múltiplas quebras de linha (trim apenas nas bordas)', () => {
    const text = 'Introdução\n\nLinha 1.\n\nLinha 2.\n\nJustificativa\nFim.';
    const sections = parseProjetoSections(text);
    const introducao = sections.find((s) => s.titulo === 'Introdução');
    expect(introducao?.conteudo).toBe('Linha 1.\n\nLinha 2.');
  });

  it('retorna seções na ordem em que aparecem no texto', () => {
    const invertido = 'Orçamento\nValor X.\n\nIntrodução\nTexto intro.';
    const sections = parseProjetoSections(invertido);
    expect(sections[0].titulo).toBe('Orçamento');
    expect(sections[1].titulo).toBe('Introdução');
  });
});