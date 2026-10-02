// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { computeRecord } from "@/domain/record";
import type { MediaDTO } from "@/features/media/dto";
import type { FighterCardDTO, FighterProfileDTO } from "../dto";
import { FIGHTER_CARD_SIZES, FighterCard } from "./fighter-card";
import { FIGHTER_HERO_SIZES, FighterHero } from "./fighter-hero";
import { RecordSummary, formatRecord } from "./record-summary";

beforeAll(() => {
  // jsdom no trae IntersectionObserver ni matchMedia; las hojas cliente los usan al montar.
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

afterEach(cleanup);

const emptyComputed = computeRecord([], "f1", "pro");

const photo: MediaDTO = {
  id: "media-1",
  kind: "fighter_body",
  width: 1200,
  height: 1800,
  focal: { x: 0.5, y: 0.5 },
  alt: "Matías Pérez de frente",
  variants: [
    { width: 400, height: 600, url: "/media/v/400.webp" },
    { width: 800, height: 1200, url: "/media/v/800.webp" },
  ],
  originalUrl: "/media/original.png",
};

const card: FighterCardDTO = {
  id: "f1",
  slug: "matias-perez",
  firstName: "Matías",
  lastName: "Pérez",
  nickname: "El Toro",
  gender: "male",
  nationality: "CL",
  careerStatus: "active",
  division: { name: "Ligero", slug: "peso-ligero", limitKg: 70.3, gender: "male" },
  record: { wins: 12, losses: 2, draws: 0, noContests: 0 },
  bodyMedia: null,
};

const profile: FighterProfileDTO = {
  ...card,
  birthDate: "1994-03-12",
  hometown: "Rancagua",
  weightKg: 70.3,
  heightCm: 180,
  reachCm: null,
  stance: "orthodox",
  gym: null,
  coach: null,
  baseDiscipline: null,
  bio: null,
  socials: {},
  proRecord: card.record,
  amateurRecord: { wins: 0, losses: 0, draws: 0, noContests: 0 },
  headshotMedia: null,
  gallery: [],
};

describe("FighterCard", () => {
  it("shows the brand silhouette instead of a broken image when there is no photo", () => {
    const { container } = render(<FighterCard fighter={card} />);
    expect(container.querySelector('[data-slot="fighter-silhouette"]')).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("links to the profile and loads the photo lazily with the listing sizes", () => {
    render(<FighterCard fighter={{ ...card, bodyMedia: photo }} />);
    expect(screen.getByRole("link", { name: "Matías Pérez" })).toHaveAttribute("href", "/peleadores/matias-perez");
    const image = screen.getByRole("img", { name: "Matías Pérez de frente" });
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).not.toHaveAttribute("fetchpriority");
    expect(image).toHaveAttribute("sizes", FIGHTER_CARD_SIZES);
  });

  it("shows the ranking number behind the photo, hidden from assistive technology", () => {
    const { container } = render(<FighterCard fighter={card} badge="Campeón" backdrop="C" />);
    expect(screen.getByText("Campeón")).toBeInTheDocument();
    const backdrop = container.querySelector('[data-slot="fighter-card-backdrop"]');
    expect(backdrop?.textContent).toBe("C");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
  });

  it("has no backdrop number without ranking", () => {
    const { container } = render(<FighterCard fighter={card} />);
    expect(container.querySelector('[data-slot="fighter-card-backdrop"]')).toBeNull();
  });

  it("requests only the first-row photo with priority", () => {
    render(<FighterCard fighter={{ ...card, bodyMedia: photo }} priority />);
    expect(screen.getByRole("img", { name: "Matías Pérez de frente" })).toHaveAttribute("fetchpriority", "high");
  });
});

describe("FighterHero", () => {
  const figures = [
    { label: "Victorias", value: 12, accent: true },
    { label: "Derrotas", value: 2 },
    { label: "Empates", value: 0 },
  ];

  it("makes the photo the LCP image: eager, high priority and real sizes", () => {
    render(<FighterHero fighter={{ ...profile, bodyMedia: photo }} figures={figures} />);
    const image = screen.getByRole("img", { name: "Matías Pérez de frente" });
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("sizes", FIGHTER_HERO_SIZES);
  });

  it("shows the short bio inside the card, under the name", () => {
    render(<FighterHero fighter={{ ...profile, bio: "Campeón peso ligero." }} figures={figures} />);
    expect(screen.getByText("Campeón peso ligero.")).toBeInTheDocument();
  });

  it("puts the champion and ranking labels in the tags slot, next to the division and status", () => {
    const { container } = render(<FighterHero fighter={profile} figures={figures} rankingTags={["Campeón pro · Peso Ligero", "#1 P4P"]} />);
    const slot = container.querySelector('[data-slot="fighter-tags"]')!;
    expect(slot.textContent).toContain("Campeón pro · Peso Ligero");
    expect(slot.textContent).toContain("#1 P4P");
    expect(slot.textContent).toContain("Peso Ligero");
  });

  it("shows only division and status when the fighter has no ranking", () => {
    const { container } = render(<FighterHero fighter={profile} figures={figures} />);
    expect(container.querySelector('[data-slot="fighter-tags"]')?.children).toHaveLength(2);
  });

  it("omits the bio paragraph when there is none", () => {
    const { container } = render(<FighterHero fighter={profile} figures={figures} />);
    expect(container.querySelector('[data-slot="fighter-bio"]')).toBeNull();
  });

  it("shows one h1 with the name, the nickname and the three figures with their final values", () => {
    render(<FighterHero fighter={profile} figures={figures} />);
    expect(screen.getByRole("heading", { level: 1, name: "Matías Pérez" })).toBeInTheDocument();
    expect(screen.getByText("“El Toro”")).toBeInTheDocument();
    expect(screen.getByText("Victorias")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="fighter-silhouette"]')).not.toBeNull();
  });
});

describe("RecordSummary", () => {
  const empty = { wins: 0, losses: 0, draws: 0, noContests: 0 };
  const noFights = { pro: emptyComputed, amateur: emptyComputed };

  it("formats records as wins-losses-draws", () => {
    expect(formatRecord({ wins: 12, losses: 2, draws: 0, noContests: 0 })).toBe("12-2-0");
    expect(formatRecord({ wins: 3, losses: 1, draws: 0, noContests: 2 })).toBe("3-1-0");
  });

  it("shows only the total record when there are no fights in Guerra Campal, and no amateur block without amateur record", () => {
    const { container } = render(<RecordSummary manual={{ pro: profile.proRecord, amateur: empty }} computed={noFights} />);
    expect(container.querySelector('[data-level="pro"] [data-record="total"]')).toHaveTextContent("12-2-0");
    expect(container.querySelector('[data-record="gc"]')).toBeNull();
    expect(container.querySelector('[data-level="amateur"]')).toBeNull();
    expect(container).not.toHaveTextContent("Sin datos");
    expect(container).not.toHaveTextContent("Sin peleas");
  });

  it("stacks the Guerra Campal record under the total, labelled in full on every screen", () => {
    const { container } = render(
      <RecordSummary manual={{ pro: profile.proRecord, amateur: empty }} computed={{ pro: { ...emptyComputed, wins: 3, losses: 1 }, amateur: emptyComputed }} />,
    );
    const pro = container.querySelector('[data-level="pro"]')!;
    const total = pro.querySelector('[data-record="total"]')!;
    const gc = pro.querySelector('[data-record="gc"]')!;
    expect(gc).toHaveTextContent("3-1-0");
    expect(total).toHaveTextContent("12-2-0");
    expect(total.compareDocumentPosition(gc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(pro.querySelector("[data-record-list]")?.className).toContain("flex-col");
    expect(gc).toHaveTextContent("Guerra Campal");
    expect(pro).not.toHaveTextContent(/GC/);
  });

  it("titles each level «Récord profesional» / «Récord amateur» on one line, the amateur one in orange, with no «Récord total» label", () => {
    const { container } = render(<RecordSummary manual={{ pro: profile.proRecord, amateur: { ...empty, wins: 4 } }} computed={noFights} />);
    const pro = container.querySelector('[data-level="pro"] h3')!;
    const amateur = container.querySelector('[data-level="amateur"] h3')!;
    expect(pro).toHaveTextContent("Récord profesional");
    expect(amateur).toHaveTextContent("Récord amateur");
    expect(pro.className).toContain("whitespace-nowrap");
    expect(amateur.className).toContain("whitespace-nowrap");
    expect(amateur.className).toContain("text-[#FF7A1A]");
    expect(pro.className).not.toContain("text-[#FF7A1A]");
    expect(container).not.toHaveTextContent("Récord total");
  });

  it("shows the average fight time in the Guerra Campal column, only when there is one", () => {
    const withTime = { ...emptyComputed, wins: 2, losses: 1, avgFightSeconds: 522 };
    const { container } = render(<RecordSummary manual={{ pro: profile.proRecord, amateur: empty }} computed={{ pro: withTime, amateur: emptyComputed }} />);
    expect(container.querySelector('[data-record="gc"]')).toHaveTextContent("Tiempo promedio");
    expect(container.querySelector('[data-record="gc"] [data-average-time]')).toHaveTextContent("8:42");

    cleanup();
    const { container: without } = render(<RecordSummary manual={{ pro: profile.proRecord, amateur: empty }} computed={{ pro: { ...emptyComputed, wins: 1 }, amateur: emptyComputed }} />);
    expect(without.querySelector("[data-average-time]")).toBeNull();
  });

  it("shows the amateur block only when it has an amateur record", () => {
    const { container } = render(<RecordSummary manual={{ pro: profile.proRecord, amateur: { ...empty, wins: 4 } }} computed={noFights} />);
    expect(container.querySelector('[data-level="amateur"] [data-record="total"]')).toHaveTextContent("4-0-0");
  });

  it("renders no section at all when there is nothing to show", () => {
    const { container } = render(<RecordSummary manual={{ pro: empty, amateur: empty }} computed={noFights} />);
    expect(container).toBeEmptyDOMElement();
  });
});
