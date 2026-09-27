import { describe, expect, it } from "vitest";
import { applyPreprodRobotsHeader, PREPROD_ROBOTS_TAG } from "./robots-header.server";

describe("applyPreprodRobotsHeader", () => {
  it("añade X-Robots-Tag en preproducción para respuestas HTML", () => {
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    applyPreprodRobotsHeader(headers, "preprod");
    expect(headers.get("X-Robots-Tag")).toBe(PREPROD_ROBOTS_TAG);
  });

  it("no añade nada en producción (APP_ENV indefinida)", () => {
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    applyPreprodRobotsHeader(headers, undefined);
    expect(headers.get("X-Robots-Tag")).toBeNull();
  });

  it("no añade nada para otros valores de APP_ENV", () => {
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    applyPreprodRobotsHeader(headers, "production");
    expect(headers.get("X-Robots-Tag")).toBeNull();
  });

  it("no añade nada en preproducción si la respuesta no es HTML", () => {
    const headers = new Headers({ "content-type": "application/json" });
    applyPreprodRobotsHeader(headers, "preprod");
    expect(headers.get("X-Robots-Tag")).toBeNull();
  });
});
