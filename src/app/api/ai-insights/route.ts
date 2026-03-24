import OpenAI from "openai";
import { NextResponse } from "next/server";

import type { AiInsightRequest, AiInsightResponse } from "@/lib/ai-insights";

const DEFAULT_MODEL = "gpt-5-mini";

function normalizeInsights(items: string[]) {
  return items
    .map((item) => item.replace(/^[\-\d\.\)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function parseInsightsFromResponse(outputText: string) {
  const trimmed = outputText.trim();

  try {
    const parsed = JSON.parse(trimmed) as { insights?: string[] };
    if (Array.isArray(parsed.insights)) {
      return normalizeInsights(parsed.insights);
    }
  } catch {
    // Fall through to line parsing below.
  }

  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");

  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as {
        insights?: string[];
      };
      if (Array.isArray(parsed.insights)) {
        return normalizeInsights(parsed.insights);
      }
    } catch {
      // Fall through to line parsing below.
    }
  }

  return normalizeInsights(trimmed.split(/\r?\n+/));
}

function isValidRequest(body: unknown): body is AiInsightRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const request = body as Partial<AiInsightRequest>;
  return Array.isArray(request.menus) && Array.isArray(request.topCostDrivers);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        insights: [],
        source: "fallback",
        generatedAt: new Date().toISOString(),
        message: "OPENAI_API_KEY가 없어 기본 분석만 사용 중입니다.",
      } satisfies AiInsightResponse,
      { status: 503 },
    );
  }

  let payload: AiInsightRequest;

  try {
    const body = (await request.json()) as unknown;
    if (!isValidRequest(body)) {
      return NextResponse.json({ error: "잘못된 AI 분석 요청입니다." }, { status: 400 });
    }
    payload = body;
  } catch {
    return NextResponse.json({ error: "AI 분석 요청을 읽지 못했습니다." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const response = await client.responses.create({
      model,
      instructions:
        "당신은 카페 가격 설계 컨설턴트다. 한국어로만 답하고, 초보 사장님도 바로 이해할 수 있게 실무 표현을 쓴다. " +
        "반드시 3개의 짧은 인사이트만 반환하라. 각 문장은 1개의 행동 제안과 1개의 구체적 숫자를 포함해야 한다. " +
        "출력은 반드시 JSON 객체 하나만 사용하고 형식은 {\"insights\":[\"...\",\"...\",\"...\"]} 로 고정한다. " +
        "불필요한 설명, 마크다운, 코드블록은 절대 넣지 마라.",
      input:
        "다음 카페 가격 데이터로 핵심 행동 제안 3개를 만들어라. " +
        "우선순위는 1) 가격 조정이 급한 메뉴 2) 이익을 가장 많이 깎는 비용 3) 판매 비중 또는 재료 예산 조정이다.\n\n" +
        JSON.stringify(payload, null, 2),
    });

    const insights = parseInsightsFromResponse(response.output_text ?? "");

    if (insights.length === 0) {
      return NextResponse.json(
        { error: "AI 분석 결과를 해석하지 못했습니다." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      insights,
      source: "ai",
      model,
      generatedAt: new Date().toISOString(),
    } satisfies AiInsightResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 분석 호출에 실패했습니다.";

    return NextResponse.json(
      {
        insights: [],
        source: "fallback",
        generatedAt: new Date().toISOString(),
        message,
      } satisfies AiInsightResponse,
      { status: 502 },
    );
  }
}
