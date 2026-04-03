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
