import { describe, expect, it } from "vitest";
import { checkRateLimit, type RateLimiterBinding } from "./rate-limit.server";

function limiterQueDevuelve(success: boolean): RateLimiterBinding {
  return { limit: async () => ({ success }) };
}

function limiterQueFalla(): RateLimiterBinding {
  return {
    limit: async () => {
      throw new Error("binding caído");
    },
  };
}

describe("checkRateLimit", () => {
  it("deja pasar cuando el binding dice que hay hueco (caso permitido)", async () => {
    expect(await checkRateLimit(limiterQueDevuelve(true), "1.2.3.4")).toBe("allowed");
  });

  it("bloquea cuando el binding dice que se ha superado el límite (caso bloqueado)", async () => {
    expect(await checkRateLimit(limiterQueDevuelve(false), "1.2.3.4")).toBe("blocked");
  });

  it("falla cerrado si el binding lanza, no deja pasar sin límite", async () => {
    expect(await checkRateLimit(limiterQueFalla(), "1.2.3.4")).toBe("error");
  });

  it("pasa la key recibida al binding, no un valor fijo", async () => {
    const keysRecibidas: string[] = [];
    const limiter: RateLimiterBinding = {
      limit: async ({ key }) => {
        keysRecibidas.push(key);
        return { success: true };
      },
    };
    await checkRateLimit(limiter, "9.9.9.9");
    expect(keysRecibidas).toEqual(["9.9.9.9"]);
  });
});
