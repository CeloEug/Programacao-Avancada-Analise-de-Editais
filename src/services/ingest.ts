import { PDFParse } from "pdf-parse";

function cleanText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[^\S\n]+/g, " ");
  return text.trim();
}


export async function parsePDF(fileBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getText();
    return cleanText(result.text);
  } finally {
    await parser.destroy();
  }
}
