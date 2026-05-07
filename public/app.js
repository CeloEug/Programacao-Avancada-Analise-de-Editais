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

    setFeedback("Proposta gerada com sucesso!", "ok");
    console.log("Resultado:", data);
  } catch {
    setFeedback("Falha de conexão com o servidor. Tente novamente em instantes.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

wireRealtimeFeedback();
form.addEventListener("submit", handleSubmit);
