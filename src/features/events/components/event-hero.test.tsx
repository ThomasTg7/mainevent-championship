// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { MediaDTO } from "@/features/media/dto";
import { stubBrowserApis } from "@/test/browser-stubs";
import type { EventPageDTO } from "../dto";
import { EventHero } from "./event-hero";

beforeAll(stubBrowserApis);
afterEach(cleanup);

const cover: MediaDTO = {
  id: "cover",
  kind: "event_hero",
  width: 1920,
  height: 1080,
  focal: { x: 0.5, y: 0.5 },
  alt: "Afiche de Guerra Campal 6",
  variants: [{ width: 1920, height: 1080, url: "/v/1920.webp" }],
  originalUrl: "/o.jpg",
};

const event = (heroMedia: MediaDTO | null) =>
  ({ name: "Guerra Campal 6", startsAt: "2026-11-01T00:00:00.000Z", eventStatus: "scheduled", segments: [], venue: { name: "Arena Santiago", address: "Av. 1", city: "Santiago", lat: null, lng: null }, heroMedia, heroMobileMedia: null }) as unknown as EventPageDTO;

const watermark = (container: HTMLElement) => container.querySelector('[data-slot="hero-watermark"]');

describe("EventHero background lettering", () => {
  it("draws the outlined «GUERRA CAMPAL» behind the fighters when there is no cover image", () => {
    const { container } = render(<EventHero event={event(null)} showCountdown={false} />);
    expect(watermark(container)?.textContent).toBe("GUERRA CAMPAL");
  });

  it("leaves an uploaded cover image clean", () => {
    const { container } = render(<EventHero event={event(cover)} showCountdown={false} />);
    expect(watermark(container)).toBeNull();
  });
});
