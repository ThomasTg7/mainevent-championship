// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_POST_BODY } from "@/domain/post-body";
import { PostEditor } from "./post-editor";

afterEach(cleanup);

function pasteText(target: Element, text: string) {
  fireEvent.paste(target, { clipboardData: { getData: (type: string) => (type === "text/plain" ? text : "") } });
}

describe("PostEditor: pasting an AI answer", () => {
  it("hands an answer in the prompt format to the form instead of pasting «TÍTULO:» as text", async () => {
    const onAiDraftPaste = vi.fn();
    const onChange = vi.fn();
    render(<PostEditor value={EMPTY_POST_BODY} onChange={onChange} onAiDraftPaste={onAiDraftPaste} />);
    const textbox = await screen.findByRole("textbox", { name: "Cuerpo de la noticia" });

    const answer = "¡Listo!\n\nTÍTULO: Uno\nBAJADA: Dos\n\nTexto.";
    pasteText(textbox, answer);
    expect(onAiDraftPaste).toHaveBeenCalledWith(answer);
    expect(textbox.textContent).not.toContain("TÍTULO");
  });

  it("lets ordinary text through to the editor", async () => {
    const onAiDraftPaste = vi.fn();
    render(<PostEditor value={EMPTY_POST_BODY} onChange={() => {}} onAiDraftPaste={onAiDraftPaste} />);
    pasteText(await screen.findByRole("textbox", { name: "Cuerpo de la noticia" }), "Un texto cualquiera.");
    expect(onAiDraftPaste).not.toHaveBeenCalled();
  });
});

describe("PostEditor: restricted mode", () => {
  it("offers «Foto» and «Video / Post» by default", async () => {
    render(<PostEditor value={EMPTY_POST_BODY} onChange={() => {}} />);
    await screen.findByRole("textbox", { name: "Cuerpo de la noticia" });
    expect(screen.getByRole("button", { name: "Imagen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Video o publicación/ })).toBeTruthy();
  });

  it("hides both and labels the box for the page text when media is not allowed", async () => {
    render(<PostEditor value={EMPTY_POST_BODY} onChange={() => {}} allowMedia={false} label="Texto de Nosotros" />);
    await screen.findByRole("textbox", { name: "Texto de Nosotros" });
    expect(screen.queryByRole("button", { name: "Imagen" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Video o publicación/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Negrita" })).toBeTruthy();
  });
});
