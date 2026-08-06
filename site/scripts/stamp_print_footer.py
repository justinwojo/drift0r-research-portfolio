#!/usr/bin/env python3
"""Stamp a multi-line disclosure footer into the bottom margin of every PDF page.

Used by render-print-pdfs.mjs after Chrome print-to-PDF. Chromium cannot place a
CSS fixed footer in the page margin without covering medical content; this script
draws the footer into the reserved @page bottom margin after layout.

Lines are word-wrapped to the page width (Letter and A4) so Helvetica text is not
clipped past the right edge. Vertical placement is checked so lines stay on-page.

Usage:
  python3 stamp_print_footer.py <pdf_path> <band_top_in> <line1> <line2> ...

Overwrites the input PDF in place.
"""
from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter

# Helvetica widths in 1/1000 em (Adobe AFM subset; default for missing = 600).
_HELVETICA: dict[str, int] = {
    " ": 278,
    "!": 278,
    '"': 355,
    "#": 556,
    "$": 556,
    "%": 889,
    "&": 667,
    "'": 191,
    "(": 333,
    ")": 333,
    "*": 389,
    "+": 584,
    ",": 278,
    "-": 333,
    ".": 278,
    "/": 278,
    "0": 556,
    "1": 556,
    "2": 556,
    "3": 556,
    "4": 556,
    "5": 556,
    "6": 556,
    "7": 556,
    "8": 556,
    "9": 556,
    ":": 278,
    ";": 278,
    "<": 584,
    "=": 584,
    ">": 584,
    "?": 556,
    "@": 1015,
    "A": 667,
    "B": 667,
    "C": 722,
    "D": 722,
    "E": 667,
    "F": 611,
    "G": 778,
    "H": 722,
    "I": 278,
    "J": 500,
    "K": 667,
    "L": 556,
    "M": 833,
    "N": 722,
    "O": 778,
    "P": 667,
    "Q": 778,
    "R": 722,
    "S": 667,
    "T": 611,
    "U": 722,
    "V": 667,
    "W": 944,
    "X": 667,
    "Y": 667,
    "Z": 611,
    "[": 278,
    "\\": 278,
    "]": 278,
    "^": 469,
    "_": 556,
    "`": 333,
    "a": 556,
    "b": 556,
    "c": 500,
    "d": 556,
    "e": 556,
    "f": 278,
    "g": 556,
    "h": 556,
    "i": 222,
    "j": 222,
    "k": 500,
    "l": 222,
    "m": 833,
    "n": 556,
    "o": 556,
    "p": 556,
    "q": 556,
    "r": 333,
    "s": 500,
    "t": 278,
    "u": 556,
    "v": 500,
    "w": 722,
    "x": 500,
    "y": 500,
    "z": 500,
    "{": 334,
    "|": 260,
    "}": 334,
    "~": 584,
    "·": 350,
}

FONT_SIZE = 6.5
LEFT_MARGIN = 36.0
RIGHT_MARGIN = 36.0
LINE_HEIGHT = 8.5
FIRST_BASELINE_DROP = 10.0
# Keep last baseline above page bottom so descenders stay on-page.
MIN_BASELINE_PT = 8.0


def escape_pdf_string(s: str) -> str:
    s = (
        s.replace("\u2014", "--")
        .replace("\u2013", "-")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u00b7", "·")
        .replace("—", "--")
        .replace("–", "-")
        .replace("'", "'")
        .replace("'", "'")
    )
    s = s.encode("latin-1", "replace").decode("latin-1")
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def text_width_pt(s: str, size: float = FONT_SIZE) -> float:
    total = 0
    for ch in s:
        total += _HELVETICA.get(ch, 600)
    return total * size / 1000.0


def wrap_text(text: str, max_width_pt: float) -> list[str]:
    """Word-wrap a single logical line so its rendered width stays within max_width_pt."""
    text = " ".join(text.split())
    if not text:
        return []
    if text_width_pt(text) <= max_width_pt:
        return [text]

    words = text.split(" ")
    lines: list[str] = []
    current = ""

    def hard_break(word: str) -> list[str]:
        chunks: list[str] = []
        buf = ""
        for ch in word:
            trial = buf + ch
            if buf and text_width_pt(trial) > max_width_pt:
                chunks.append(buf)
                buf = ch
            else:
                buf = trial
        if buf:
            chunks.append(buf)
        return chunks

    for word in words:
        trial = f"{current} {word}".strip() if current else word
        if text_width_pt(trial) <= max_width_pt:
            current = trial
            continue
        if current:
            lines.append(current)
            current = ""
        if text_width_pt(word) <= max_width_pt:
            current = word
        else:
            pieces = hard_break(word)
            lines.extend(pieces[:-1])
            current = pieces[-1] if pieces else ""
    if current:
        lines.append(current)
    return lines


def layout_footer_lines(
    width: float, height: float, lines: list[str], band_top_in: float
) -> list[tuple[str, float, float]]:
    """Return (text, x, y) placements; raise if any line would leave the page box."""
    # 6pt safety pad so glyph metrics / pdfminer bbox noise cannot clip at the edge.
    max_w = width - LEFT_MARGIN - RIGHT_MARGIN - 6.0
    if max_w < 100:
        raise ValueError(f"page too narrow for footer: width={width}")

    wrapped: list[str] = []
    for line in lines:
        wrapped.extend(wrap_text(line, max_w))

    y_top = band_top_in * 72.0
    y = y_top - FIRST_BASELINE_DROP
    placements: list[tuple[str, float, float]] = []
    for text in wrapped:
        w = text_width_pt(text)
        x0 = LEFT_MARGIN
        x1 = x0 + w
        y0 = y - FONT_SIZE * 0.2  # approximate descender
        y1 = y + FONT_SIZE * 0.8
        if x0 < 0 or x1 > width + 0.5:
            raise ValueError(
                f"footer line exceeds horizontal page bounds: "
                f"x0={x0:.1f} x1={x1:.1f} width={width:.1f} text={text[:60]!r}"
            )
        if y0 < 0 or y < MIN_BASELINE_PT or y1 > height:
            raise ValueError(
                f"footer line exceeds vertical page bounds: "
                f"y0={y0:.1f} y={y:.1f} y1={y1:.1f} height={height:.1f} "
                f"band_top_in={band_top_in} lines={len(wrapped)} text={text[:60]!r}"
            )
        placements.append((text, x0, y))
        y -= LINE_HEIGHT
    return placements


def build_overlay(width: float, height: float, lines: list[str], band_top_in: float) -> bytes:
    placements = layout_footer_lines(width, height, lines, band_top_in)
    y_top = band_top_in * 72.0
    cmds = [
        "q",
        "0.5 w",
        f"{LEFT_MARGIN:.2f} {y_top:.2f} m {width - RIGHT_MARGIN:.2f} {y_top:.2f} l S",
        "Q",
        "BT",
        f"/F1 {FONT_SIZE} Tf",
    ]
    for text, x, y in placements:
        cmds.append(f"1 0 0 1 {x:.2f} {y:.2f} Tm ({escape_pdf_string(text)}) Tj")
    cmds.append("ET")
    stream = "\n".join(cmds).encode("latin-1")

    parts: list[bytes] = []
    offsets: dict[int, int] = {}

    def w(data: bytes) -> None:
        parts.append(data)

    def obj(n: int, body: bytes) -> None:
        offsets[n] = sum(len(p) for p in parts)
        w(f"{n} 0 obj\n".encode("ascii") + body + b"\nendobj\n")

    w(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    obj(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    obj(2, b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    obj(
        3,
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width:.3f} {height:.3f}] "
            f"/Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>"
        ).encode("ascii"),
    )
    obj(4, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    obj(5, b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")
    xref_pos = sum(len(p) for p in parts)
    w(b"xref\n")
    w(f"0 {len(offsets)}\n".encode("ascii"))
    w(b"0000000000 65535 f \n")
    for i in range(1, len(offsets)):
        w(f"{offsets[i]:010d} 00000 n \n".encode("ascii"))
    w(
        f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return b"".join(parts)


def main() -> int:
    if len(sys.argv) < 4:
        print(
            "usage: stamp_print_footer.py <pdf> <band_top_in> <line> [line ...]",
            file=sys.stderr,
        )
        return 2
    pdf_path = Path(sys.argv[1])
    band_top_in = float(sys.argv[2])
    lines = sys.argv[3:]
    reader = PdfReader(str(pdf_path))
    writer = PdfWriter()
    for page in reader.pages:
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        overlay_bytes = build_overlay(w, h, lines, band_top_in)
        overlay = PdfReader(BytesIO(overlay_bytes)).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)
    tmp = pdf_path.with_suffix(".stamped.pdf")
    with open(tmp, "wb") as f:
        writer.write(f)
    tmp.replace(pdf_path)
    print(f"stamped {len(reader.pages)} pages -> {pdf_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
