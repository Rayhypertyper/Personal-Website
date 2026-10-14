import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

export interface TourTextRun {
  text: string;
  strong: boolean;
}
type TourTextCopyProps = {
  text: string;
  runs?: TourTextRun[];
  visible?: number;
  letters?: boolean;
  cursor?: ReactNode;
};
interface TourTypedTextProps {
  text: string;
  runs?: TourTextRun[];
  characters: number;
  offset?: number;
  cursor?: boolean;
  paused?: boolean;
  accessible?: boolean;
}

type TourGlyph = {
  character: string;
  endOffset: number;
  key: string;
};
type TourSegment = {
  strong: boolean;
  index: number;
  endOffset: number;
  glyphs: TourGlyph[];
};

export function TourTextCopy({ text, runs, visible = text.length, letters = false, cursor }: TourTextCopyProps) {
  const amount = Math.max(0, Math.min(text.length, visible));
  let offset = 0;
  const segments = (runs ?? [{ text, strong: false }]).map((run, segmentIndex): TourSegment => {
    const glyphs = Array.from(run.text).map((character, glyphIndex) => {
      offset += character.length;
      return { character, endOffset: offset, key: `${segmentIndex}:${glyphIndex}` };
    });
    return { strong: run.strong, index: segmentIndex, endOffset: offset, glyphs };
  });
  const glyphs = segments.flatMap((segment) => segment.glyphs);
  const lastRevealed = amount === 0 ? undefined : glyphs.filter((glyph) => glyph.endOffset <= amount).at(-1);
  const cursorAnchor = lastRevealed ?? glyphs[0];
  const cursorAtStart = amount === 0 || !lastRevealed;
  const copyRef = useRef<HTMLSpanElement>(null);
  const copyContentRef = useRef<HTMLSpanElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const cursorPositionRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!cursor) return;
    const copy = copyRef.current;
    const cursorPosition = cursorPositionRef.current;
    if (!copy || !cursorPosition) return;

    let active = true;
    const updatePosition = () => {
      if (!active) return;
      const copyBounds = copy.getBoundingClientRect();
      const copyContent = copyContentRef.current;
      const measureGlyph = (glyph: HTMLSpanElement, leading: boolean) => {
        const textNode = glyph.firstChild;
        if (textNode?.nodeType !== Node.TEXT_NODE || !textNode.textContent) return null;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.textContent.length);
        const rects = Array.from(range.getClientRects()).filter((rect) => rect.height > 0);
        return (leading ? rects[0] : rects.at(-1)) ?? null;
      };
      let bounds = anchorRef.current ? measureGlyph(anchorRef.current, cursorAtStart) : null;
      let atLeadingEdge = cursorAtStart;
      if (!bounds && copyContent) {
        const glyphs = Array.from(copyContent.querySelectorAll<HTMLSpanElement>(".tour-typed-text__glyph"));
        if (cursorAtStart) {
          for (const glyph of glyphs) {
            bounds = measureGlyph(glyph, true);
            if (bounds) break;
          }
        } else {
          const revealed = glyphs.filter((glyph) => !glyph.classList.contains("tour-typed-text__glyph--unrevealed"));
          const anchorIndex = revealed.indexOf(anchorRef.current as HTMLSpanElement);
          const candidates = (anchorIndex >= 0 ? revealed.slice(0, anchorIndex + 1) : revealed).reverse();
          for (const glyph of candidates) {
            bounds = measureGlyph(glyph, false);
            if (bounds) break;
          }
        }
      }
      const targetBounds = bounds ?? copyBounds;
      if (!bounds) atLeadingEdge = true;
      const fontSize = Number.parseFloat(getComputedStyle(copy).fontSize) || 16;
      const x = atLeadingEdge ? targetBounds.left : targetBounds.right;
      const baseline = targetBounds.bottom - fontSize * 0.15;
      cursorPosition.style.left = `${x - copyBounds.left}px`;
      cursorPosition.style.top = `${baseline - copyBounds.top}px`;
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
    observer?.observe(copy);
    const fontSet = document.fonts;
    fontSet.addEventListener("loadingdone", updatePosition);
    void fontSet.ready.then(() => { if (active) updatePosition(); });
    updatePosition();

    return () => {
      active = false;
      observer?.disconnect();
      fontSet.removeEventListener("loadingdone", updatePosition);
    };
  }, [amount, cursor, cursorAtStart, letters, runs, text]);

  const renderGlyph = (glyph: TourGlyph) => {
    const revealed = glyph.endOffset <= amount;
    const className = [
      "tour-typed-text__glyph",
      revealed ? "" : "tour-typed-text__glyph--unrevealed",
      letters ? "tour-typed-char" : "",
    ].filter(Boolean).join(" ");
    return (
      <span className={className} data-revealed={letters ? String(revealed) : undefined}
        key={glyph.key} ref={cursor && glyph.key === cursorAnchor?.key ? anchorRef : undefined}>
        {glyph.character}
      </span>
    );
  };
  const renderGlyphs = (segmentGlyphs: TourGlyph[]) => {
    if (!letters) return segmentGlyphs.map(renderGlyph);
    const nodes: ReactNode[] = [];
    let word: TourGlyph[] = [];
    const flushWord = () => {
      if (word.length === 0) return;
      nodes.push(<span className="tour-typed-text__word" key={`word:${word[0].key}`}>{word.map(renderGlyph)}</span>);
      word = [];
    };
    segmentGlyphs.forEach((glyph) => {
      if (/^\s+$/u.test(glyph.character)) {
        flushWord();
        nodes.push(renderGlyph(glyph));
      } else {
        word.push(glyph);
      }
    });
    flushWord();
    return nodes;
  };

  const copyContent = runs
    ? segments.map((segment) => {
      const copy = renderGlyphs(segment.glyphs);
      return segment.strong
        ? <strong data-complete={segment.endOffset <= amount || undefined} key={segment.index}>{copy}</strong>
        : <span key={segment.index}>{copy}</span>;
    })
    : renderGlyphs(segments[0].glyphs);

  return (
    <span className="tour-typed-text__copy" ref={copyRef}>
      <span className="tour-typed-text__copy-content" ref={copyContentRef}>{copyContent}</span>
      {cursor ? <span className="tour-typed-text__cursor-position" ref={cursorPositionRef} aria-hidden="true">{cursor}</span> : null}
    </span>
  );
}

/** Original reserved-layout typing, without count-ups or glyph arrivals. */
export function TourTypedText({ text, runs, characters, offset = 0, cursor = true, paused = false, accessible = true }: TourTypedTextProps) {
  const visible = Math.max(0, Math.min(text.length, characters - offset));
  const typingHere = cursor && characters >= offset && characters < offset + text.length;
  const typedCursor = typingHere ? <span className={`tour-typed-cursor${paused ? " is-paused" : ""}`} /> : null;
  return (
    <span className="tour-typed-text">
      <span className="tour-typed-text__reserve" aria-hidden="true"><TourTextCopy text={text} runs={runs} /></span>
      <span className="tour-typed-text__visible" aria-hidden="true" data-glyph-copy="true">
        <TourTextCopy text={text} runs={runs} visible={visible} cursor={typedCursor} />
      </span>
      {accessible ? <span className="sr-only">{text}</span> : null}
    </span>
  );
}
