# Skill: integration-pattern

Use this skill when adding a new method to `BackendApiService` or wiring a new mt-backend endpoint into the bot.

---

## Core Rules

- All HTTP calls to mt-backend go through `BackendApiService` in `src/backend-api/services/`.
- For JSON request bodies, use `HttpService` (`this.http.post/get/patch`).
- For multipart/form-data (file uploads), use raw `fetch` directly (as in `analyzeFood`).
- Never introduce axios, got, node-fetch, or any other HTTP client.

---

## JSON Endpoint Pattern

```ts
async callJsonEndpoint(tgId: string, payload: SomeDto): Promise<ResponseDto> {
  try {
    const response = await this.http.post<ResponseDto>(
      `${this.baseUrl}/some-path?tgId=${tgId}`,
      payload,
      this.apiHeaders,
    );
    return response.data;
  } catch (error) {
    this.logger.error('callJsonEndpoint failed', error);
    throw error;
  }
}
```

---

## Analysis Endpoint Pattern (OpenAI pipeline — may be slow)

Use `retries: 0` to avoid creating duplicate entries, and `timeout: 30000` because OpenAI calls can take 15–20s.

```ts
async analyzeTextFood(tgId: string, textDescription: string): Promise<FoodAnalysisResponseDto> {
  try {
    const response = await this.http.request<FoodAnalysisResponseDto>({
      method: 'POST',
      url: `${this.baseUrl}/food-analysis/analyze-text?tgId=${tgId}`,
      body: { textDescription },
      headers: this.apiHeaders,
      timeout: 30000,
      retries: 0,
    });
    return response.data;
  } catch (error) {
    this.logger.error('analyzeTextFood failed', error);
    throw error;
  }
}
```

---

## Retry and Backoff Behavior

`HttpService` reads from environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `HTTP_TIMEOUT_MS` | `10000` | Request timeout per attempt |
| `HTTP_RETRIES` | `3` | Number of retry attempts |
| `HTTP_RETRY_DELAY_MS` | `1000` | Base delay; multiplied linearly per attempt |

Override per-call using `this.http.request({ ..., timeout, retries })`.

---

## API Headers

Always pass `this.apiHeaders` (the `X-API-KEY` getter) as the headers argument. Never hardcode the key.

---

## DTOs

Every new backend endpoint needs a corresponding DTO file in `src/backend-api/dto/` mirroring the mt-backend response shape.

---

## Post-Integration Checklist

- [ ] New method added to `BackendApiService`
- [ ] Corresponding DTO added to `src/backend-api/dto/` if the response shape is new
- [ ] `timeout: 30000` and `retries: 0` set for analysis/OpenAI endpoints
- [ ] Method called from `BotService`, not from the update handler directly
- [ ] Error logged and re-thrown so `BotService` can reply with `formatError()`
