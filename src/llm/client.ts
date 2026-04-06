import "dotenv/config";
import OpenAI, { APIError } from "openai";

const MODEL = "gpt-4.1";
const TEMPERATURE = 0.3;
const MAX_OUTPUT_TOKENS = 1000;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is missing or empty. Set it in your environment or .env file."
    );
  }
  return new OpenAI({ apiKey });
}

export async function callLLM(prompt: string): Promise<string> {
  if (typeof prompt !== "string") {
    throw new Error("callLLM expects a string prompt.");
  }

  const client = getClient();

  try {
    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      temperature: TEMPERATURE,
      max_output_tokens: MAX_OUTPUT_TOKENS,
    });

    const text = response.output_text?.trim();
    if (!text) {
      throw new Error("OpenAI returned an empty response.");
    }
    return text;
  } catch (error: unknown) {
    console.error("OpenAI API error:", error);

    if (error instanceof APIError) {
      const detail = error.message || "unknown error";
      throw new Error(
        `OpenAI request failed (${error.status ?? "no status"}): ${detail}`
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("OpenAI request failed with an unexpected error.");
  }
}
