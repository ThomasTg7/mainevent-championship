import { describe, expect, it } from "vitest";
import { oflPublicPath } from "./legacy-brand-path";

describe("legacy promotion links", () => {
  it("redirects events, fight pages and news to OFL slugs", () => {
    expect(oflPublicPath("/eventos/guerra-campal-5")).toBe("/eventos/ofl-5");
    expect(oflPublicPath("/eventos/guerra-campal-1/peleas/bout-id")).toBe("/eventos/ofl-1/peleas/bout-id");
    expect(oflPublicPath("/noticias/resumen-de-guerra-campal-4")).toBe("/noticias/resumen-de-ofl-4");
  });
  it("leaves other routes and current links unchanged", () => {
    for (const path of ["/eventos/ofl-5", "/noticias/perez-defiende-el-cinturon-ante-soto", "/admin/eventos/guerra-campal-5", "/media/guerra-campal.webp"]) expect(oflPublicPath(path)).toBe(path);
  });
});
