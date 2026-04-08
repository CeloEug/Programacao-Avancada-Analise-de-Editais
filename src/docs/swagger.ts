import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API — Análise de Editais",
      version: "1.0.0",
      description:
        "Serviço de ingestão de PDF (extração de texto) e pipeline de geração de projeto a partir de campos estruturados.",
    },
    servers: [{ url: "http://localhost:3000", description: "Ambiente local" }],
    paths: {
      "/generate": {
        post: {
          tags: ["Pipeline"],
          summary: "Gera proposta completa a partir de um edital PDF",
          description:
            "Recebe o PDF do edital e os metadados do projeto. Internamente executa: ingestão do PDF, extração de requisitos, geração do rascunho e validação de conformidade.",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: { $ref: "#/components/schemas/GenerateRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Proposta e validação geradas com sucesso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/GenerateResponse" },
                },
              },
            },
            "400": {
              description: "Arquivo ou campos obrigatórios ausentes",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
            "500": {
              description: "Falha ao processar o edital",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        GenerateRequest: {
          type: "object",
          required: ["file", "titulo", "descricao", "objetivos", "metodologia", "orcamento", "equipe"],
          properties: {
            file:        { type: "string", format: "binary", description: "Arquivo PDF do edital" },
            titulo:      { type: "string", description: "Título do projeto" },
            descricao:   { type: "string", description: "Descrição resumida" },
            objetivos:   { type: "string", description: "Objetivos principais" },
            metodologia: { type: "string", description: "Metodologia" },
            orcamento:   { type: "string", description: "Orçamento estimado" },
            equipe:      { type: "string", description: "Composição da equipe" },
          },
        },
        GenerateResponse: {
          type: "object",
          required: ["requisitos", "projeto", "checklist", "validacao"],
          properties: {
            requisitos: {
              type: "object",
              description: "Requisitos extraídos do edital (Stage 2)",
              properties: {
                prazo:     { type: "string" },
                criterios: { type: "array", items: { type: "string" } },
                formato:   { type: "string" },
                temas:     { type: "array", items: { type: "string" } },
              },
            },
            projeto: { type: "string", description: "Rascunho completo do projeto (Stage 3)" },
            checklist: {
              type: "object",
              description: "Checklist de conformidade (Stage 3)",
              additionalProperties: true,
            },
            validacao: {
              type: "object",
              description: "Resultado da validação cruzada (Stage 4)",
              properties: {
                ok:        { type: "array", items: { type: "string" } },
                faltando:  { type: "array", items: { type: "string" } },
                sugestoes: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        ErrorMessage: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string", description: "Mensagem de erro" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options) as Record<string, unknown>;
