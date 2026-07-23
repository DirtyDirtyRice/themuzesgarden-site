import { describe, expect, it, vi } from "vitest";
import {
  createTimelineOpenAITransport,
  timelineOpenAIConfigurationStatus,
} from "../../lib/timeline/TimelineOpenAITransport";

function request(signal = new AbortController().signal) {
  return {
    model: "gpt-test",
    messages: [{ role: "user" as const, content: "Review this event." }],
    temperature: 0.3,
    maxOutputTokens: 500,
    responseFormat: "json" as const,
    signal,
  };
}

describe("TimelineOpenAITransport", () => {
  it("sends server-authenticated structured requests and captures usage", async () => {
    const fetchImplementation = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer test-key",
        "OpenAI-Project": "project-id",
      });
      expect(body.text.format.type).toBe("json_schema");
      expect(body.input[0].content[0].text).toBe("Review this event.");
      return new Response(
        JSON.stringify({
          id: "response-id",
          model: "gpt-test-2026",
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({ answer: "Ready", proposals: [] }),
                },
              ],
            },
          ],
          usage: { input_tokens: 12, output_tokens: 4, total_tokens: 16 },
        }),
        { status: 200 }
      );
    });
    const transport = createTimelineOpenAITransport({
      apiKey: "test-key",
      project: "project-id",
      fetchImplementation: fetchImplementation as typeof fetch,
    });

    const result = await transport(request());

    expect(result.id).toBe("response-id");
    expect(result.model).toBe("gpt-test-2026");
    expect(result.usage.totalTokens).toBe(16);
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });

  it("refuses to run without a server API key", async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const transport = createTimelineOpenAITransport({
        apiKey: "",
        fetchImplementation: vi.fn() as unknown as typeof fetch,
      });
      await expect(transport(request())).rejects.toThrow("not configured");
      expect(timelineOpenAIConfigurationStatus({ apiKey: "" }).configured).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });

  it("turns provider failures into actionable errors", async () => {
    const transport = createTimelineOpenAITransport({
      apiKey: "test-key",
      fetchImplementation: vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: {
              message: "Your quota is exhausted.",
              code: "insufficient_quota",
            },
          }),
          { status: 429 }
        )
      ) as unknown as typeof fetch,
    });

    await expect(transport(request())).rejects.toThrow(
      "rate limit or quota was reached"
    );
  });

  it("honors cancellation before a provider request begins", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImplementation = vi.fn();
    const transport = createTimelineOpenAITransport({
      apiKey: "test-key",
      fetchImplementation: fetchImplementation as unknown as typeof fetch,
    });

    await expect(transport(request(controller.signal))).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
