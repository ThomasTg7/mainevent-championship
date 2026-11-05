// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
  it("is announced as a single image named Mainevent Championship", () => {
    render(<Logo />);

    expect(screen.getByRole("img", { name: "Mainevent Championship" })).toBeInTheDocument();
  });
});
