import { describe, expect, it } from "vitest";
import { fightersHref, parsePublicFilters } from "./public-filters";

describe("parsePublicFilters", () => {
  it("defaults to active fighters and page 1", () => {
    expect(parsePublicFilters({})).toEqual({ filters: { status: "active" }, page: 1 });
  });

  it("maps the URL params to filters", () => {
    const { filters, page } = parsePublicFilters({ q: "  perez ", division: "peso-ligero", pais: "cl", genero: "female", estado: "retired", pagina: "3" });
    expect(filters).toEqual({ q: "perez", division: "peso-ligero", nationality: "CL", gender: "female", status: "retired" });
    expect(page).toBe(3);
  });

  it("lets estado=all list every career status", () => {
    expect(parsePublicFilters({ estado: "all" }).filters.status).toBeUndefined();
  });

  it("ignores invalid values instead of failing", () => {
    const { filters, page } = parsePublicFilters({ genero: "otro", estado: "xyz", pais: "chile", division: ["a", "b"], pagina: "-2" });
    expect(filters).toEqual({ status: "active" });
    expect(page).toBe(1);
  });

  it("keeps only the first value of a repeated param and caps the search length", () => {
    expect(parsePublicFilters({ q: ["uno", "dos"] }).filters.q).toBe("uno");
    expect(parsePublicFilters({ q: "x".repeat(200) }).filters.q).toHaveLength(60);
  });
});

describe("fightersHref", () => {
  it("builds a shareable URL, omitting defaults", () => {
    expect(fightersHref({ status: "active" }, 1)).toBe("/peleadores");
    expect(fightersHref({ q: "perez", division: "peso-ligero", status: "active" }, 2)).toBe("/peleadores?q=perez&division=peso-ligero&pagina=2");
    expect(fightersHref({ nationality: "AR", gender: "male", status: "retired" }, 1)).toBe("/peleadores?pais=AR&genero=male&estado=retired");
    expect(fightersHref({}, 1)).toBe("/peleadores?estado=all");
  });
});
