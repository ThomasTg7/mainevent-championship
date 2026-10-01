import { describe, expect, it } from "vitest";
import { embedCanonicalUrl, embedFromAttrs, embedSrc, parseEmbedUrl } from "./embed";

describe("parseEmbedUrl", () => {
  it("recognizes an Instagram post with tracking parameters", () => {
    expect(parseEmbedUrl("https://www.instagram.com/p/C8abc123/?igsh=xyz")).toEqual({ provider: "instagram", id: "C8abc123" });
  });

  it("recognizes an Instagram reel", () => {
    expect(parseEmbedUrl("https://www.instagram.com/reel/C9xyz/")).toEqual({ provider: "instagram", id: "C9xyz" });
    expect(parseEmbedUrl("https://instagram.com/reels/C9xyz")).toEqual({ provider: "instagram", id: "C9xyz" });
  });

  it("recognizes an Instagram post that carries the account in the path", () => {
    expect(parseEmbedUrl("https://www.instagram.com/guerracampal/p/C8abc123/")).toEqual({ provider: "instagram", id: "C8abc123" });
  });

  it("recognizes YouTube short links, shorts, watch and embed urls", () => {
    const expected = { provider: "youtube", id: "dQw4w9WgXcQ" };
    expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=10")).toEqual(expected);
    expect(parseEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual(expected);
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1")).toEqual(expected);
    expect(parseEmbedUrl("https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ")).toEqual(expected);
    expect(parseEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual(expected);
  });

  it("recognizes a TikTok video", () => {
    expect(parseEmbedUrl("https://www.tiktok.com/@gc/video/7412345678901234567")).toEqual({ provider: "tiktok", id: "7412345678901234567" });
    expect(parseEmbedUrl("https://www.tiktok.com/@gc/video/7412345678901234567?is_from_webapp=1")).toEqual({
      provider: "tiktok",
      id: "7412345678901234567",
    });
  });

  it("tolerates surrounding whitespace and a missing scheme", () => {
    expect(parseEmbedUrl("  youtu.be/dQw4w9WgXcQ \n")).toEqual({ provider: "youtube", id: "dQw4w9WgXcQ" });
  });

  it("rejects other sites and malformed links", () => {
    expect(parseEmbedUrl("https://example.com")).toBeNull();
    expect(parseEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseEmbedUrl("https://www.youtube.com/watch")).toBeNull();
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=corto")).toBeNull();
    expect(parseEmbedUrl("https://www.instagram.com/guerracampal/")).toBeNull();
    expect(parseEmbedUrl("https://www.tiktok.com/@gc")).toBeNull();
    expect(parseEmbedUrl("javascript:alert(1)")).toBeNull();
    expect(parseEmbedUrl("")).toBeNull();
    expect(parseEmbedUrl("no es un link")).toBeNull();
  });

  it("does not accept look-alike hosts", () => {
    expect(parseEmbedUrl("https://youtube.com.evil.cl/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseEmbedUrl("https://notyoutu.be/dQw4w9WgXcQ")).toBeNull();
    expect(parseEmbedUrl("https://user@www.instagram.com/p/C8abc123/")).toBeNull();
  });
});

describe("embedSrc", () => {
  it("uses the no-cookie domain for YouTube", () => {
    expect(embedSrc({ provider: "youtube", id: "dQw4w9WgXcQ" })).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("builds the Instagram and TikTok embed urls", () => {
    expect(embedSrc({ provider: "instagram", id: "C8abc123" })).toBe("https://www.instagram.com/p/C8abc123/embed");
    expect(embedSrc({ provider: "tiktok", id: "7412345678901234567" })).toBe("https://www.tiktok.com/embed/v2/7412345678901234567");
  });
});

describe("embedCanonicalUrl", () => {
  it("gives the public link of each network", () => {
    expect(embedCanonicalUrl({ provider: "youtube", id: "dQw4w9WgXcQ" })).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(embedCanonicalUrl({ provider: "instagram", id: "C8abc123" })).toBe("https://www.instagram.com/p/C8abc123/");
    expect(embedCanonicalUrl({ provider: "tiktok", id: "7412345678901234567" })).toBe("https://www.tiktok.com/@/video/7412345678901234567");
  });
});

describe("embedFromAttrs", () => {
  it("accepts the attributes of a stored embed node and nothing that is not exactly a network and an id", () => {
    expect(embedFromAttrs({ provider: "youtube", id: "dQw4w9WgXcQ" })).toEqual({ provider: "youtube", id: "dQw4w9WgXcQ" });
    expect(embedFromAttrs({ provider: "tiktok", id: "7412345678901234567", extra: "ignorado" })).toEqual({ provider: "tiktok", id: "7412345678901234567" });
    expect(embedFromAttrs({ provider: "facebook", id: "123" })).toBeNull();
    expect(embedFromAttrs({ provider: "youtube", id: "dQw4w9WgXcQ/../x" })).toBeNull();
    expect(embedFromAttrs({ provider: "youtube" })).toBeNull();
    expect(embedFromAttrs(null)).toBeNull();
    expect(embedFromAttrs("youtube")).toBeNull();
  });
});
