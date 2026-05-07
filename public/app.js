import { parseProjetoSections } from './parse-projeto.js';

const REQUIRED_FIELDS = [
  "titulo",
  "descricao",
  "objetivos",
  "metodologia",
  "orcamento",
  "equipe",
];

const FIELD_LABELS = {
  titulo:      "Título",
  descricao:   "Descrição",
  objetivos:   "Objetivos",
  metodologia: "Metodologia",
  orcamento:   "Orçamento",
  equipe:      "Equipe",
};

const form        = document.getElementById("pipeline-form");
const feedbackEl  = document.getElementById("feedback");
const submitBtn   = document.getElementById("submit-btn");
const pdfFileInput = document.getElementById("pdf-file");

function getFieldContainer(name) {
  return document.querySelector(`[data-field="${name}"]`);
}

function getFieldValue(name) {
  const input = form.elements.namedItem(name);
  if (!input || typeof input.value !== "string") {
    return "";
  }
  return input.value.trim();
}

function setFieldError(name, message) {
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (!errorEl) return;
  errorEl.textContent = message;

  const container = getFieldContainer(name);
  if (!container) return;

  container.classList.remove("is-valid", "is-invalid");
  if (message) {
    container.classList.add("is-invalid");
    return;
  }

  if (getFieldValue(name).length >= 3) {
    container.classList.add("is-valid");
  }
}

function clearErrors() {
  for (const field of REQUIRED_FIELDS) {
    setFieldError(field, "");
  }
}

function validate(payload) {
  const errors = {};

  for (const [key, value] of Object.entries(payload)) {
    if (!value) {
      errors[key] = "Campo obrigatório.";
      continue;
    }

    if (value.length < 3) {
      errors[key] = "Digite pelo menos 3 caracteres.";
    }
  }

  return errors;
}

function buildPayload() {
  return {
    titulo:      getFieldValue("titulo"),
    descricao:   getFieldValue("descricao"),
    objetivos:   getFieldValue("objetivos"),
    metodologia: getFieldValue("metodologia"),
    orcamento:   getFieldValue("orcamento"),
    equipe:      getFieldValue("equipe"),
  };
}

/** @param {"error" | "info" | "ok"} variant */
function setFeedback(text, variant = "error") {
  feedbackEl.textContent = text;
  feedbackEl.classList.remove("is-info", "is-ok");
  if (variant === "info") feedbackEl.classList.add("is-info");
  if (variant === "ok") feedbackEl.classList.add("is-ok");
}

function clearFeedback() {
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("is-info", "is-ok");
}

function wireRealtimeFeedback() {
  for (const field of REQUIRED_FIELDS) {
    const input = form.elements.namedItem(field);
    if (!input || typeof input.addEventListener !== "function") {
      continue;
    }

    input.addEventListener("input", () => {
      if (getFieldValue(field).length >= 3) {
        setFieldError(field, "");
      }
    });
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();
  clearFeedback();

  const payload = buildPayload();
  const errors  = validate(payload);

  if (Object.keys(errors).length > 0) {
    for (const [field, message] of Object.entries(errors)) {
      setFieldError(field, message);
    }

    const missing = Object.keys(errors)
      .map((field) => `• ${FIELD_LABELS[field] ?? field}`)
      .join(" ");
    setFeedback(`Preencha corretamente os campos: ${missing}`, "error");
    return;
  }

  const file = pdfFileInput?.files?.[0];
  if (!file) {
    setFeedback("Selecione um arquivo PDF do edital.", "error");
    return;
  }

  submitBtn.disabled = true;
  setFeedback("Processando...", "info");

  const formData = new FormData();
  formData.append("file", file);
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value);
  }

  try {
    const response = await fetch("/generate", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setFeedback(
        "Não foi possível gerar a proposta agora. Verifique os dados e tente novamente.",
        "error"
      );
      return;
    }

    renderResultado(data);
    setFeedback("Proposta gerada com sucesso!", "ok");
  } catch {
    setFeedback("Falha de conexão com o servidor. Tente novamente em instantes.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

const resultadoSection  = document.getElementById('resultado');
const projetoAccordions = document.getElementById('projeto-accordions');
const validacaoBlocos   = document.getElementById('validacao-blocos');
const checklistContainer = document.getElementById('checklist-container');
const requisitosBloco   = document.getElementById('requisitos-bloco');
const resetBtn          = document.getElementById('reset-btn');

function buildAccordions(projeto) {
  const sections = parseProjetoSections(projeto);
  projetoAccordions.innerHTML = '';

  sections.forEach(({ titulo, conteudo }, index) => {
    const item = document.createElement('div');
    item.className = 'accordion-item' + (index === 0 ? ' open' : '');

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `<span>${titulo}</span><span class="accordion-icon">▶</span>`;
    header.addEventListener('click', () => item.classList.toggle('open'));

    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.textContent = conteudo || '(sem conteúdo)';

    item.append(header, body);
    projetoAccordions.appendChild(item);
  });
}

function buildValidacao(validacao) {
  const configs = [
    { key: 'ok',        label: '✅ Atendidos',  cls: 'ok' },
    { key: 'faltando',  label: '❌ Faltando',   cls: 'faltando' },
    { key: 'sugestoes', label: '💡 Sugestões',  cls: 'sugestoes' },
  ];

  validacaoBlocos.innerHTML = '';

  for (const { key, label, cls } of configs) {
    const items = validacao[key] ?? [];
    const block = document.createElement('div');
    block.className = `validation-block ${cls}`;

    const title = document.createElement('h4');
    title.textContent = label;

    const list = document.createElement('ul');
    if (items.length === 0) {
      const li = document.createElement('li');
      li.textContent = '—';
      list.appendChild(li);
    } else {
      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
    }

    block.append(title, list);
    validacaoBlocos.appendChild(block);
  }
}

function buildChecklist(checklist) {
  checklistContainer.innerHTML = '';
  const items = Array.isArray(checklist) ? checklist : [];

  if (items.length === 0) {
    checklistContainer.textContent = '—';
    return;
  }

  const table = document.createElement('table');
  table.className = 'checklist-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Requisito</th><th>Status</th></tr>';

  const tbody = document.createElement('tbody');
  items.forEach(({ requisito, status }) => {
    const tr = document.createElement('tr');
    const tdReq = document.createElement('td');
    tdReq.textContent = requisito;
    const tdStatus = document.createElement('td');
    tdStatus.textContent = String(status);
    tr.append(tdReq, tdStatus);
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  checklistContainer.appendChild(table);
}

function buildRequisitos(requisitos) {
  requisitosBloco.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'requisitos-grid';

  const fields = [
    { label: 'Prazo', value: requisitos.prazo },
    { label: 'Formato', value: requisitos.formato },
    { label: 'Critérios', value: requisitos.criterios },
    { label: 'Temas', value: requisitos.temas },
  ];

  for (const { label, value } of fields) {
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
    if (isEmpty) continue;

    const item = document.createElement('div');
    item.className = 'requisito-item';

    const strong = document.createElement('strong');
    strong.textContent = label;
    item.appendChild(strong);

    if (Array.isArray(value)) {
      const ul = document.createElement('ul');
      value.forEach((v) => {
        const li = document.createElement('li');
        li.textContent = v;
        ul.appendChild(li);
      });
      item.appendChild(ul);
    } else {
      item.append(value);
    }

    grid.appendChild(item);
  }

  requisitosBloco.appendChild(grid);
}

function renderResultado(data) {
  buildAccordions(data.projeto ?? '');
  buildValidacao(data.validacao ?? {});
  buildChecklist(data.checklist ?? {});
  buildRequisitos(data.requisitos ?? {});

  resultadoSection.style.display = 'block';
  resultadoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetResultado() {
  resultadoSection.style.display = 'none';
  projetoAccordions.innerHTML  = '';
  validacaoBlocos.innerHTML    = '';
  checklistContainer.innerHTML = '';
  requisitosBloco.innerHTML    = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

resetBtn.addEventListener('click', resetResultado);

wireRealtimeFeedback();
form.addEventListener("submit", handleSubmit);
