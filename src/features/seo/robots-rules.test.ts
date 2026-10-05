import { describe, expect, it } from "vitest";
import { robotsRules } from "./robots-rules";

const base = { host: "guerracampal.cl", siteUrl: "https://guerracampal.cl", adminHost: "admin.guerracampal.cl", allowIndexing: false };

describe("robotsRules", () => {
  it("closes the admin panel to every robot, always", () => {
    expect(robotsRules({ ...base, host: "admin.guerracampal.cl" })).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(robotsRules({ ...base, host: "admin.guerracampal.cl", allowIndexing: true })).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("lets robots into the site, but not into /admin or /api, and points to the sitemap", () => {
    expect(robotsRules(base)).toEqual({
      rules: { userAgent: "*", disallow: ["/admin", "/api"] },
      sitemap: "https://guerracampal.cl/sitemap.xml",
    });
  });

  it("closes a *.vercel.app test site until indexing is allowed", () => {
    const vercel = { ...base, host: "gc.vercel.app", siteUrl: "https://gc.vercel.app" };
    expect(robotsRules(vercel)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(robotsRules({ ...vercel, allowIndexing: true })).toEqual({
      rules: { userAgent: "*", disallow: ["/admin", "/api"] },
      sitemap: "https://gc.vercel.app/sitemap.xml",
    });
  });

  it("builds the sitemap URL from SITE_URL even when the request came through another host", () => {
    expect(robotsRules({ ...base, host: "www.guerracampal.cl" }).sitemap).toBe("https://guerracampal.cl/sitemap.xml");
  });
});
