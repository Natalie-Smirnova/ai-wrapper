import { describe, it, expect, vi } from "vitest";
import { chunkText, extractText } from "./parser";

describe("chunkText", () => {
  it("returns empty array for empty string", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("returns single chunk for text shorter than chunk size", () => {
    const text = "Hello world";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("splits long text into overlapping chunks", () => {
    const text = "a".repeat(2000);
    const chunks = chunkText(text);

    // First chunk: 0-1000, second: 800-1800, third: 1600-2000
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(1000);
    expect(chunks[1]).toHaveLength(1000);
    expect(chunks[2]).toHaveLength(400);
  });

  it("creates overlapping regions between consecutive chunks", () => {
    const text = Array.from({ length: 2000 }, (_, i) => String(i % 10)).join(
      ""
    );
    const chunks = chunkText(text);

    // Last 200 chars of chunk 0 should equal first 200 chars of chunk 1
    const overlapFromFirst = chunks[0].slice(-200);
    const overlapFromSecond = chunks[1].slice(0, 200);
    expect(overlapFromFirst).toBe(overlapFromSecond);
  });

  it("handles text exactly at chunk size boundary", () => {
    // 1000 chars → first chunk 0-1000, then start=800 < 1000 → second chunk 800-1000
    const text = "x".repeat(1000);
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(1000);
    expect(chunks[1]).toHaveLength(200); // overlap tail
  });
});

describe("extractText", () => {
  it("extracts plain text from text/plain buffer", async () => {
    const text = "Hello, world!";
    const buffer = Buffer.from(text, "utf-8");
    const result = await extractText(buffer, "text/plain");
    expect(result).toBe(text);
  });

  it("extracts text from text/markdown buffer", async () => {
    const md = "# Heading\n\nParagraph text";
    const buffer = Buffer.from(md, "utf-8");
    const result = await extractText(buffer, "text/markdown");
    expect(result).toBe(md);
  });

  it("falls back to utf-8 for unknown mime types", async () => {
    const content = "some content";
    const buffer = Buffer.from(content, "utf-8");
    const result = await extractText(buffer, "application/octet-stream");
    expect(result).toBe(content);
  });

  it("handles unicode text correctly", async () => {
    const text = "Привет мир! 你好世界 🌍";
    const buffer = Buffer.from(text, "utf-8");
    const result = await extractText(buffer, "text/plain");
    expect(result).toBe(text);
  });
});
