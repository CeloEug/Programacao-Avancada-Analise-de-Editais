import "dotenv/config";
import OpenAI, { APIError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { infer as zInfer, ZodType } from "zod";

const MODEL = "gpt-5.4";
const TEMPERATURE = 0.3;
const MAX_OUTPUT_TOKENS = 1000;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is missing or empty. Set it in your environment or .env file.",
    );
  }
  return new OpenAI({ apiKey });
}

export type StructuredLLMResult<T> =
  | {
      parsed: T;
      refusal: null;
    }
  | {
      parsed: null;
      refusal: string;
    };

/**
 * Calls the OpenAI Responses API with structured output validation.
 *
 * Separates trusted instructions from untrusted user content to mitigate
 * prompt injection: `systemPrompt` is sent via the high-authority
 * `instructions` parameter, while `userContent` is sent via `input`.
 *
 * @param systemPrompt - Developer-level instructions (Identity, Instructions,
 *   Examples). Passed to the `instructions` API parameter, which takes
 *   priority over user input.
 * @param userContent - User-supplied data (e.g. edital text, project fields),
 *   typically wrapped in XML tags. Passed to the `input` API parameter.
 * @param schema - Zod schema describing the expected response shape.
 * @param schemaName - Identifier for the schema used by the SDK's structured
 *   output formatter.
 * @returns `{ parsed, refusal: null }` on success, or
 *   `{ parsed: null, refusal }` when the model explicitly refuses.
 * @throws When the API call fails or returns an empty structured response.
 */
export async function callStructuredLLM<Schema extends ZodType>(
  systemPrompt: string,
  userContent: string,
  schema: Schema,
  schemaName: string,
): Promise<StructuredLLMResult<zInfer<Schema>>> {
  if (typeof schemaName !== "string" || !schemaName.trim()) {
    throw new Error("callStructuredLLM expects a non-empty schema name.");
  }

  const client = getClient();

  try {
    const response = await client.responses.parse({
      model: MODEL,
      instructions: systemPrompt,
      input: userContent,
      temperature: TEMPERATURE,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      text: {
        format: zodTextFormat(schema, schemaName),
      },
    });

    if (response.output_parsed) {
      return {
        parsed: response.output_parsed,
        refusal: null,
      };
    }

    for (const output of response.output) {
      if (output.type !== "message") {
        continue;
      }

      for (const item of output.content) {
        if (item.type === "refusal") {
          return {
            parsed: null,
            refusal: item.refusal,
          };
        }

        if (item.type === "output_text" && item.parsed) {
          return {
            parsed: item.parsed,
            refusal: null,
          };
        }
      }
    }

    throw new Error("OpenAI returned an empty structured response.");
  } catch (error: unknown) {
    console.error("OpenAI API error:", error);

    if (error instanceof APIError) {
      const detail = error.message || "unknown error";
      throw new Error(
        `OpenAI request failed (${error.status ?? "no status"}): ${detail}`,
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("OpenAI request failed with an unexpected error.");
  }
}
