// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { MediaDTO } from "@/features/media/dto";
import { stubBrowserApis } from "@/test/browser-stubs";
import type { BoutDTO, BoutFighterDTO, EventPageDTO } from "../dto";
import { EventHero } from "./event-hero";

beforeAll(stubBrowserApis);
afterEach(cleanup);

const cover: MediaDTO = {
  id: "cover",
  kind: "event_hero",
  width: 1920,
  height: 1080,
  focal: { x: 0.5, y: 0.5 },
  alt: "Afiche de OFL 6",
  variants: [{ width: 1920, height: 1080, url: "/v/1920.webp" }],
  originalUrl: "/o.jpg",
};

const event = (heroMedia: MediaDTO | null) =>
  ({ name: "OFL 6", startsAt: "2026-11-01T00:00:00.000Z", eventStatus: "scheduled", segments: [], venue: { name: "Arena Santiago", address: "Av. 1", city: "Santiago", lat: null, lng: null }, heroMedia, heroMobileMedia: null }) as unknown as EventPageDTO;

const watermark = (container: HTMLElement) => container.querySelector('[data-slot="hero-watermark"]');

describe("EventHero background lettering", () => {
  it("links Dónde ver to the configured broadcast", () => {
    render(<EventHero event={{ ...event(cover), streamUrl: "https://youtube.com/watch?v=test" }} showCountdown={false} />);
    expect(screen.getByRole("link", { name: "Dónde ver" })).toHaveAttribute("href", "https://youtube.com/watch?v=test");
    expect(screen.getByRole("link", { name: "Dónde ver" })).toHaveClass("bg-brand", "text-white");
  });

  it("provides a broadcast information destination when no stream is announced", () => {
    render(<EventHero event={event(null)} showCountdown={false} />);
    expect(screen.getByRole("link", { name: "Dónde ver" })).toHaveAttribute("href", "#donde-ver");
    expect(screen.getByText("Pronto anunciaremos dónde ver este evento.")).toBeInTheDocument();
  });
  it("draws the outlined «OFL» behind the fighters when there is no cover image", () => {
    const { container } = render(<EventHero event={event(null)} showCountdown={false} />);
    expect(watermark(container)?.textContent).toBe("OFL");
  });

  it("leaves an uploaded cover image clean", () => {
    const { container } = render(<EventHero event={event(cover)} showCountdown={false} />);
    expect(watermark(container)).toBeNull();
  });

  it("keeps the mobile cover variants and its independently selected focal point", () => {
    const mobile = { ...cover, id: "mobile", focal: { x: 0.2, y: 0.8 }, variants: [{ width: 800, height: 1200, url: "/v/mobile.webp" }] };
    const { container } = render(<EventHero event={{ ...event(cover), heroMobileMedia: mobile }} showCountdown={false} />);
    expect(container.querySelector("source")).toHaveAttribute("srcset", "/v/mobile.webp 800w");
    expect(container.querySelector("img")?.style.getPropertyValue("--hero-mobile-position")).toBe("20% 80%");
    expect(container.querySelector("img")?.style.getPropertyValue("--hero-desktop-position")).toBe("50% 50%");
  });
});

describe("EventHero face-off", () => {
  const headshot: MediaDTO = { ...cover, id: "face", kind: "fighter_headshot", width: 800, height: 800, alt: "Pérez, rostro" };
  const corner = (lastName: string, photos: Pick<BoutFighterDTO, "headshotMedia" | "bodyMedia">) => ({ firstName: "X", lastName, ...photos }) as BoutFighterDTO;
  const withMainBout = (red: BoutFighterDTO, blue: BoutFighterDTO) =>
    ({ ...event(null), segments: [{ id: "s", name: "Estelar", startsAt: null, bouts: [{ id: "b", status: "scheduled", red, blue } as unknown as BoutDTO] }] }) as EventPageDTO;

  it("uses the headshot of a fighter without a body photo, and the silhouette only for one without photos", () => {
    const { container } = render(
      <EventHero event={withMainBout(corner("Pérez", { headshotMedia: headshot, bodyMedia: null }), corner("Soto", { headshotMedia: null, bodyMedia: null }))} showCountdown={false} />,
    );
    const kinds = [...container.querySelectorAll("[data-photo]")].map((slot) => slot.getAttribute("data-photo"));
    expect(kinds).toEqual(["headshot", "silhouette"]);
    expect(container.querySelector('img[alt="Pérez, rostro"]')).not.toBeNull();
  });
});
