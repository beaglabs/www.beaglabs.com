from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


PAGE_W = 960
PAGE_H = 540
MARGIN_X = 54
MARGIN_Y = 42

WHITE = HexColor("#000000")
PANEL = HexColor("#FCFBF8")
INK = HexColor("#111111")
MUTED = HexColor("#5F5B57")
TAUPE = HexColor("#6B6864")
LINE = Color(17 / 255, 17 / 255, 17 / 255, alpha=0.10)
LINE_SOFT = Color(17 / 255, 17 / 255, 17 / 255, alpha=0.06)


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
PITCH = PUBLIC / "pitch"
LOGO = PUBLIC / "logo.png"
FONT_REGULAR = PUBLIC / "fonts" / "Inter-Regular.ttf"
FONT_BOLD = PUBLIC / "fonts" / "Inter-Bold.ttf"

TOTAL_SLIDES = 6


def register_fonts() -> None:
    if FONT_REGULAR.exists():
        pdfmetrics.registerFont(TTFont("DeckInter", str(FONT_REGULAR)))
    if FONT_BOLD.exists():
        pdfmetrics.registerFont(TTFont("DeckInter-Bold", str(FONT_BOLD)))


def font(*, bold: bool = False) -> str:
    if bold and "DeckInter-Bold" in pdfmetrics.getRegisteredFontNames():
        return "DeckInter-Bold"
    if not bold and "DeckInter" in pdfmetrics.getRegisteredFontNames():
        return "DeckInter"
    return "Helvetica-Bold" if bold else "Helvetica"


def background(c: canvas.Canvas) -> None:
    c.setFillColor(WHITE)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def draw_logo(c: canvas.Canvas, x: float, y: float, size: float) -> None:
    c.drawImage(ImageReader(str(LOGO)), x, y, width=size, height=size, mask="auto")


def text_block(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    *,
    size: float,
    leading: float,
    color,
    bold: bool = False,
) -> float:
    current_y = y
    font_name = font(bold=bold)
    c.setFont(font_name, size)
    c.setFillColor(color)
    for paragraph in text.split("\n"):
        lines = simpleSplit(paragraph, font_name, size, width) if paragraph else [""]
        for line in lines:
            c.drawString(x, current_y, line)
            current_y -= leading
        current_y -= leading * 0.3
    return current_y


def eyebrow(c: canvas.Canvas, text: str, x: float, y: float) -> None:
    c.setFillColor(TAUPE)
    c.setFont(font(), 9)
    c.drawString(x, y, text.upper())


def pill(c: canvas.Canvas, text: str, x: float, y: float, width: float | None = None) -> float:
    label = text.upper()
    c.setFont(font(), 9)
    w = width or max(86, c.stringWidth(label, font(), 9) + 22)
    c.setStrokeColor(LINE)
    c.setFillColor(WHITE)
    c.roundRect(x, y, w, 22, 11, fill=1, stroke=1)
    c.setFillColor(INK)
    c.drawCentredString(x + w / 2, y + 7, label)
    return w


def centered_text_block(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    *,
    size: float,
    leading: float,
    color,
    bold: bool = False,
) -> float:
    current_y = y
    font_name = font(bold=bold)
    c.setFont(font_name, size)
    c.setFillColor(color)
    for paragraph in text.split("\n"):
        lines = simpleSplit(paragraph, font_name, size, width) if paragraph else [""]
        for line in lines:
            c.drawCentredString(x + width / 2, current_y, line)
            current_y -= leading
        current_y -= leading * 0.3
    return current_y


def section_rule(c: canvas.Canvas, x: float, y: float, width: float = 46) -> None:
    c.setStrokeColor(TAUPE)
    c.setLineWidth(1)
    c.line(x, y, x + width, y)


def card(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    title: str,
    body: str,
    label: str | None = None,
    *,
    align: str = "left",
) -> None:
    c.setStrokeColor(LINE)
    c.setFillColor(PANEL)
    c.roundRect(x, y, w, h, 10, fill=1, stroke=1)
    c.setStrokeColor(LINE_SOFT)
    c.line(x + 18, y + h - 34, x + w - 18, y + h - 34)
    if label:
        c.setFillColor(TAUPE)
        c.setFont(font(), 8)
        c.drawString(x + 16, y + h - 22, label.upper())
    if align == "center":
        inner_x = x + 20
        inner_w = w - 40
        title_y = y + h - 68 if label else y + h - 50
        body_y = centered_text_block(c, title, inner_x, title_y, inner_w, size=15, leading=18, color=INK, bold=True) - 8
        centered_text_block(c, body, inner_x, body_y, inner_w, size=10.2, leading=14, color=MUTED)
    else:
        c.setFillColor(INK)
        c.setFont(font(bold=True), 15)
        c.drawString(x + 16, y + h - 50, title)
        text_block(c, body, x + 16, y + h - 78, w - 32, size=10.5, leading=14, color=MUTED)


def bullets(c: canvas.Canvas, items: list[str], x: float, y: float, width: float, *, size: float = 10.4) -> float:
    current_y = y
    for item in items:
        lines = simpleSplit(item, font(), size, width - 12)
        c.setFillColor(MUTED)
        c.setFont(font(), size)
        c.drawString(x, current_y, u"•")
        line_y = current_y
        for line in lines:
            c.drawString(x + 11, line_y, line)
            line_y -= size + 3
        current_y = line_y - 3
    return current_y


def footer(c: canvas.Canvas, left: str, page_num: int) -> None:
    c.setStrokeColor(LINE_SOFT)
    c.line(MARGIN_X, 28, PAGE_W - MARGIN_X, 28)
    c.setFillColor(MUTED)
    c.setFont(font(), 9)
    c.drawString(MARGIN_X, 14, left)
    c.drawRightString(PAGE_W - MARGIN_X, 14, f"{page_num:02d} / {TOTAL_SLIDES:02d}")


def header_brand(c: canvas.Canvas, right_label: str) -> None:
    draw_logo(c, MARGIN_X, PAGE_H - 52, 26)
    c.setFillColor(INK)
    c.setFont(font(bold=True), 11)
    c.drawString(MARGIN_X + 38, PAGE_H - 34, "BEAG LABS")
    c.setFillColor(MUTED)
    c.setFont(font(), 9)
    c.drawString(MARGIN_X + 38, PAGE_H - 49, "Applied AI research lab")
    pill(c, right_label, PAGE_W - MARGIN_X - 160, PAGE_H - 42, 160)


def slide_1(c: canvas.Canvas) -> None:
    background(c)
    header_brand(c, "Pitch deck / July 2026")
    eyebrow(c, "Applied AI Research Laboratory", MARGIN_X, PAGE_H - 100)
    text_block(
        c,
        "We are an applied AI research lab focused on\nstate-space models, RWKV, and\nscientific analysis use cases.",
        MARGIN_X,
        PAGE_H - 132,
        520,
        size=26,
        leading=29,
        color=INK,
        bold=True,
    )
    c.setStrokeColor(INK)
    c.setLineWidth(1.2)
    c.line(MARGIN_X, 154, MARGIN_X + 78, 154)
    text_block(
        c,
        "We combine architecture research with practical system-building. Our operating model is roughly 70% building and 30% research, with near-term monetization through AI-enabled services agreements.",
        MARGIN_X,
        132,
        418,
        size=12,
        leading=17,
        color=MUTED,
    )

    card(c, 560, 166, 346, 180, "What we are building", "A company that monetizes quickly through AI-enabled services and compounds opted-in data into a long-term model advantage for spatial and scientific AI.", "Thesis")
    bullets(
        c,
        [
            "State-space models and RWKV are the architectural entry point.",
            "We start at the data-format and representation layer.",
            "The long-term goal is a general foundation model for scientific use cases.",
        ],
        578,
        220,
        302,
        size=9.2,
    )
    c.setStrokeColor(LINE)
    c.line(MARGIN_X, 82, PAGE_W - MARGIN_X, 82)
    c.setFillColor(INK)
    c.setFont(font(bold=True), 11)
    c.drawString(MARGIN_X, 58, "State-space models. RWKV. Scientific analysis.")
    c.setFillColor(MUTED)
    c.setFont(font(), 10)
    c.drawRightString(PAGE_W - MARGIN_X, 58, "Services first. Representation layer next. Foundation model over time.")
    footer(c, "www.beaglabs.com", 1)


def slide_2(c: canvas.Canvas) -> None:
    background(c)
    header_brand(c, "Scientific AI thesis")
    eyebrow(c, "The Core Problem", MARGIN_X, PAGE_H - 92)
    section_rule(c, MARGIN_X, PAGE_H - 114)
    text_block(
        c,
        "Science breaks generic AI because the world is not stored in one clean modality.",
        MARGIN_X,
        PAGE_H - 124,
        660,
        size=24,
        leading=28,
        color=INK,
        bold=True,
    )
    text_block(
        c,
        "The hard problem is not only reasoning. It is the many different data formats, dimensions, coordinate systems, and physical assumptions required to communicate multi-spatial concepts across scientific workflows.",
        MARGIN_X,
        PAGE_H - 170,
        760,
        size=11.6,
        leading=16,
        color=MUTED,
    )
    card(c, MARGIN_X, 150, 268, 180, "Heterogeneous formats", "Scientific work is spread across incompatible file types, array layouts, tables, grids, coordinate frames, and discipline-specific conventions.", "01", align="center")
    card(c, 346, 150, 268, 180, "Hidden semantics", "Spatial, temporal, and physical meaning often lives outside the raw tensor. General AI systems miss the semantics that scientists actually use.", "02", align="center")
    card(c, 638, 150, 268, 180, "Cross-disciplinary failure", "Most current models operate within a single modality or domain. Scientific intelligence requires movement across representations and disciplines.", "03", align="center")
    footer(c, "Scientific AI needs a representation layer before it needs a universal assistant", 2)


def slide_3(c: canvas.Canvas) -> None:
    background(c)
    header_brand(c, "Business model")
    eyebrow(c, "How We Monetize", MARGIN_X, PAGE_H - 92)
    section_rule(c, MARGIN_X, PAGE_H - 114)
    text_block(
        c,
        "We plan to monetize fast through AI-enabled services agreements with a forward deployed engineering model.",
        MARGIN_X,
        PAGE_H - 124,
        740,
        size=23,
        leading=27,
        color=INK,
        bold=True,
    )
    text_block(
        c,
        "The near-term business looks more like Palantir than a pure API company: embed deeply, solve hard technical workflows, and use that work to produce durable data, product insight, and domain trust.",
        MARGIN_X,
        PAGE_H - 170,
        760,
        size=11.6,
        leading=16,
        color=MUTED,
    )
    card(c, MARGIN_X, 156, 268, 168, "70 / 30 mix", "About 70% of effort goes to delivery and 30% to research. Revenue stays close to the work while technical edge keeps compounding.", "Operating model", align="center")
    card(c, 346, 156, 268, 168, "FDE services", "Start with forward deployed AI work inside real scientific workflows. Contracts fund execution, trust, and reusable implementation patterns.", "Near term", align="center")
    card(c, 638, 156, 268, 168, "Compounding data", "Each opted-in deployment sharpens product direction, representation requirements, and the long-run training corpus.", "Long term", align="center")

    c.setStrokeColor(LINE)
    c.line(MARGIN_X, 130, PAGE_W - MARGIN_X, 130)
    c.setFillColor(INK)
    c.setFont(font(bold=True), 10.5)
    c.drawString(MARGIN_X, 112, "Budget planning")
    c.drawString(488, 112, "Financial GTM expectations")
    bullets(
        c,
        [
            "Target 2-3 year service contracts at about $200k total contract value per customer.",
            "That implies roughly $67k-$100k in annualized revenue per account depending on term length.",
            "Keep research spend tied to services margin instead of a separate burn-heavy team.",
        ],
        MARGIN_X,
        94,
        360,
        size=9.6,
    )
    bullets(
        c,
        [
            "Land with forward deployed work, then expand into multi-year workflow ownership.",
            "4-6 active contracts implies about $800k-$1.2M in contracted backlog and roughly $267k-$600k in annualized revenue.",
            "Prioritize scientific teams where deployments produce repeatable workflows and opt-in learning value.",
        ],
        488,
        94,
        364,
        size=9.6,
    )
    footer(c, "Services first, model platform second, data flywheel throughout", 3)


def slide_4(c: canvas.Canvas) -> None:
    background(c)
    header_brand(c, "Where we start")
    eyebrow(c, "Starting Point", MARGIN_X, PAGE_H - 92)
    section_rule(c, MARGIN_X, PAGE_H - 114)
    text_block(
        c,
        "The plan is to start at the data format layer.",
        MARGIN_X,
        PAGE_H - 124,
        620,
        size=25,
        leading=29,
        color=INK,
        bold=True,
    )
    text_block(
        c,
        "Science's hard problem is that many different formats and dimensions are required to communicate multi-spatial concepts. If we cannot unify the representation layer, we cannot build truly general scientific AI.",
        MARGIN_X,
        PAGE_H - 168,
        760,
        size=11.6,
        leading=16,
        color=MUTED,
    )

    steps = [
        ("01", "Ingest", "Capture heterogeneous scientific assets across formats, structures, and dimensions."),
        ("02", "Normalize", "Represent coordinates, arrays, tables, transforms, and metadata in a common computational form."),
        ("03", "Learn", "Train jointly over data structures, semantics, and domain transformations."),
        ("04", "Generalize", "Move toward models that operate across scientific disciplines instead of a single modality."),
    ]
    x = MARGIN_X
    for label, title, body in steps:
        card(c, x, 140, 196, 190, title, body, label, align="center")
        x += 219
    footer(c, "Format layer first because representation is the bottleneck", 4)


def slide_5(c: canvas.Canvas) -> None:
    background(c)
    header_brand(c, "Representation layer")
    eyebrow(c, "Research Thesis", MARGIN_X, PAGE_H - 92)
    section_rule(c, MARGIN_X, PAGE_H - 114)
    text_block(
        c,
        "We believe the missing layer for general scientific AI is a representation layer that unifies heterogeneous scientific data formats and their underlying spatial, temporal, and physical semantics.",
        MARGIN_X,
        PAGE_H - 122,
        820,
        size=20,
        leading=24,
        color=INK,
        bold=True,
    )
    card(c, MARGIN_X, 132, 256, 188, "What must be learned", "The model should learn not only values, but also data structures, coordinate systems, domain transformations, and the relations between them.", "01", align="center")
    card(c, 352, 132, 256, 188, "What becomes possible", "By learning jointly over structure and semantics, a model can reason across disciplines rather than being trapped inside one modality or file type.", "02", align="center")
    card(c, 650, 132, 256, 188, "Why this matters", "A general scientific foundation model will need to move fluidly through spatial, temporal, and physical representations that today's models mostly ignore.", "03", align="center")

    c.setStrokeColor(LINE)
    c.line(MARGIN_X, 102, PAGE_W - MARGIN_X, 102)
    text_block(
        c,
        "This is the bridge from applied services to defensible model IP: every deployment teaches us more about the representations required for cross-disciplinary scientific intelligence.",
        MARGIN_X,
        84,
        760,
        size=11.2,
        leading=15,
        color=MUTED,
    )
    footer(c, "Representation is the missing abstraction for general scientific AI", 5)


def slide_6(c: canvas.Canvas) -> None:
    background(c)
    header_brand(c, "Closing")
    eyebrow(c, "Vision", MARGIN_X, PAGE_H - 92)
    section_rule(c, MARGIN_X, PAGE_H - 114)
    text_block(
        c,
        "Our goal is to build the first general foundation model for spatial and scientific use cases.",
        MARGIN_X,
        PAGE_H - 124,
        760,
        size=24,
        leading=28,
        color=INK,
        bold=True,
    )
    text_block(
        c,
        "We will get there by mixing a build-heavy operating model with focused research, monetizing quickly through forward deployed AI services, and compounding toward a unified representation layer for scientific intelligence.",
        MARGIN_X,
        PAGE_H - 170,
        780,
        size=11.6,
        leading=16,
        color=MUTED,
    )

    card(c, MARGIN_X, 138, 268, 178, "Near-term company", "AI-enabled services agreements, forward deployed engineering, and technical workflow ownership.", "Revenue", align="center")
    card(c, 346, 138, 268, 178, "Compounding asset", "Opted-in data and domain knowledge that improve the representation layer and future model training.", "Moat", align="center")
    card(c, 638, 138, 268, 178, "Long-term outcome", "A foundation model capable of operating across scientific disciplines rather than within a single modality.", "Vision", align="center")

    c.setStrokeColor(LINE)
    c.line(MARGIN_X, 98, PAGE_W - MARGIN_X, 98)
    text_block(c, "Beag Labs. State-space models. RWKV. Scientific analysis.", MARGIN_X, 78, 420, size=12, leading=16, color=INK, bold=True)
    text_block(c, "https://www.beaglabs.com/\nhttps://github.com/beaglabs", 650, 78, 220, size=10.4, leading=14, color=MUTED)
    footer(c, "Prepared for Nvidia Inception", 6)


def build() -> Path:
    register_fonts()
    output = PITCH / "beaglabs-pitch-deck.pdf"
    c = canvas.Canvas(str(output), pagesize=(PAGE_W, PAGE_H))
    for slide in [slide_1, slide_2, slide_3, slide_4, slide_5, slide_6]:
        slide(c)
        c.showPage()
    c.save()
    return output


if __name__ == "__main__":
    print(build())
