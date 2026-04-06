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
      "/upload": {
        post: {
          tags: ["Ingestão"],
          summary: "Upload de PDF e extração de texto",
          description: "Recebe um arquivo PDF em multipart e devolve o texto extraído e normalizado.",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "Arquivo PDF",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Texto extraído com sucesso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UploadSuccess" },
                },
              },
            },
            "400": {
              description: "Nenhum arquivo enviado ou campo incorreto",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
            "500": {
              description: "Falha ao processar o PDF",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
          },
        },
      },
      "/validate": {
        post: {
          tags: ["Validação"],
          summary: "Validação do projeto contra os requisitos do edital",
          description: "Verifica se o projeto atende aos requisitos e retorna itens ok, faltando e sugestões.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidateRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Checklist de validação gerado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidateResponse" },
                },
              },
            },
            "400": {
              description: "Campos requisitos ou projeto ausentes",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
            "500": {
              description: "Falha ao validar (ex.: erro no LLM)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
          },
        },
      },
      "/extract": {
        post: {
          tags: ["Extração"],
          summary: "Extração estruturada de informações do edital",
          description: "Recebe o texto de um edital e retorna prazo, critérios, formato e temas extraídos via LLM.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExtractRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Informações extraídas com sucesso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ExtractResponse" },
                },
              },
            },
            "400": {
              description: "Campo editalText ausente ou inválido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
            "500": {
              description: "Falha ao extrair informações (ex.: erro no LLM)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
          },
        },
      },
      "/pipeline": {
        post: {
          tags: ["Pipeline"],
          summary: "Pipeline completo (geração de projeto)",
          description:
            "Executa o pipeline com base em metadados do projeto e retorna texto gerado e um checklist estruturado.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PipelineRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Projeto e checklist gerados",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PipelineResponse" },
                },
              },
            },
            "400": {
              description: "Corpo inválido ou campos obrigatórios ausentes",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorMessage" },
                },
              },
            },
            "500": {
              description: "Erro ao gerar conteúdo (ex.: falha no provedor LLM)",
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
        ValidateRequest: {
          type: "object",
          required: ["requisitos", "projeto"],
          properties: {
            requisitos: { type: "string", description: "Requisitos extraídos do edital" },
            projeto: { type: "string", description: "Texto do projeto gerado" },
          },
        },
        ValidateResponse: {
          type: "object",
          properties: {
            ok: {
              type: "array",
              items: { type: "string" },
              description: "Requisitos atendidos",
            },
            faltando: {
              type: "array",
              items: { type: "string" },
              description: "Requisitos não atendidos",
            },
            sugestoes: {
              type: "array",
              items: { type: "string" },
              description: "Sugestões de melhoria",
            },
          },
          required: ["ok", "faltando", "sugestoes"],
        },
        ExtractRequest: {
          type: "object",
          required: ["editalText"],
          properties: {
            editalText: { type: "string", description: "Texto completo do edital" },
          },
        },
        ExtractResponse: {
          type: "object",
          properties: {
            prazo: { type: "string", description: "Prazo de submissão" },
            criterios: {
              type: "array",
              items: { type: "string" },
              description: "Critérios de avaliação",
            },
            formato: { type: "string", description: "Formato exigido de submissão" },
            temas: {
              type: "array",
              items: { type: "string" },
              description: "Temas ou áreas de interesse",
            },
          },
          required: ["prazo", "criterios", "formato", "temas"],
        },
        ErrorMessage: {
          type: "object",
          properties: {
            error: { type: "string", description: "Mensagem de erro" },
          },
          required: ["error"],
        },
        UploadSuccess: {
          type: "object",
          properties: {
            text: { type: "string", description: "Texto extraído do PDF" },
          },
          required: ["text"],
        },
        PipelineRequest: {
          type: "object",
          required: [
            "titulo",
            "descricao",
            "objetivos",
            "metodologia",
            "orcamento",
            "equipe",
          ],
          properties: {
            titulo: { type: "string" },
            descricao: { type: "string" },
            objetivos: { type: "string" },
            metodologia: { type: "string" },
            orcamento: { type: "string" },
            equipe: { type: "string" },
          },
        },
        PipelineResponse: {
          type: "object",
          properties: {
            projeto: { type: "string", description: "Texto sintetizado do projeto" },
            checklist: {
              type: "object",
              description: "Checklist estruturado (chaves definidas pelo modelo)",
              additionalProperties: true,
            },
          },
          required: ["projeto", "checklist"],
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options) as Record<string, unknown>;
