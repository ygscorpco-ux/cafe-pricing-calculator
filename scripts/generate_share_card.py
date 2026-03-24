from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
LOGO_PATH = ROOT / "public" / "branding" / "cafe.png"
OUTPUT_PATH = ROOT / "public" / "share-card.png"

WIDTH = 1200
HEIGHT = 630
BRAND = (27, 71, 151)
BRAND_LIGHT = (73, 118, 207)
TEXT = (20, 38, 75)
MUTED = (84, 104, 144)
BG = (242, 246, 255)
PANEL = (255, 255, 255)


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    font_path = Path("C:/Windows/Fonts") / name
    return ImageFont.truetype(str(font_path), size=size)


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def gradient_panel(size: tuple[int, int], start: tuple[int, int, int], end: tuple[int, int, int]) -> Image.Image:
    width, height = size
    panel = Image.new("RGBA", size)
    panel_draw = ImageDraw.Draw(panel)

    for y in range(height):
        t = y / max(height - 1, 1)
        color = tuple(lerp(start[i], end[i], t) for i in range(3)) + (255,)
        panel_draw.line((0, y, width, y), fill=color)

    return panel


def main() -> None:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), BG + (255,))
    draw = ImageDraw.Draw(canvas)

    title_font = load_font("malgunbd.ttf", 52)
    subtitle_font = load_font("malgun.ttf", 26)
    eyebrow_font = load_font("malgunbd.ttf", 18)
    pill_font = load_font("malgunbd.ttf", 24)
    pill_label_font = load_font("malgun.ttf", 18)

    draw.ellipse((-180, -120, 280, 340), fill=(223, 233, 255, 255))
    draw.ellipse((900, 350, 1320, 760), fill=(230, 238, 255, 255))
    draw.rounded_rectangle((120, 84, 280, 122), radius=18, fill=(225, 235, 255, 255))

    shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((42, 52, 1158, 586), radius=42, fill=(31, 72, 151, 36))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(shadow)

    card_bounds = (38, 44, 1162, 588)
    draw.rounded_rectangle(card_bounds, radius=42, fill=PANEL + (255,), outline=(214, 225, 247, 255), width=2)

    band = gradient_panel((418, 476), BRAND, BRAND_LIGHT)
    band_mask = Image.new("L", band.size, 0)
    ImageDraw.Draw(band_mask).rounded_rectangle((0, 0, 418, 476), radius=34, fill=255)
    band.putalpha(band_mask)
    canvas.alpha_composite(band, (704, 82))

    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo.thumbnail((480, 150), Image.Resampling.LANCZOS)
    logo_x = 92
    logo_y = 146
    canvas.alpha_composite(logo, (logo_x, logo_y))

    draw.text((92, 94), "CAFE PRICING CALCULATOR", font=eyebrow_font, fill=BRAND)
    draw.text((92, 330), "아따 얼만교?", font=title_font, fill=TEXT)
    draw.text((92, 408), "카페 메뉴 가격 · 원가 · 목표 순이익 계산", font=subtitle_font, fill=MUTED)
    draw.text((92, 452), "초보자도 몇 번의 입력만으로 권장 판매가를 바로 확인합니다.", font=subtitle_font, fill=MUTED)

    pill_specs = [
        ("월 순이익", "답부터 확인"),
        ("원재료비 30%", "현장 기준으로 시작"),
        ("권장 판매가", "목표 순이익 역산"),
    ]

    pill_y = 146
    for label, value in pill_specs:
        pill_box = (744, pill_y, 1082, pill_y + 92)
        draw.rounded_rectangle(pill_box, radius=28, fill=(255, 255, 255, 238), outline=(255, 255, 255, 108), width=2)
        draw.text((772, pill_y + 18), label, font=pill_label_font, fill=(82, 111, 177))
        draw.text((772, pill_y + 44), value, font=pill_font, fill=BRAND)
        pill_y += 112

    draw.rounded_rectangle((744, 482, 1082, 542), radius=24, fill=(255, 255, 255, 226))
    draw.text((772, 500), "cafe-pricing-calculator.vercel.app", font=pill_label_font, fill=(82, 111, 177))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUTPUT_PATH, quality=95)


if __name__ == "__main__":
    main()
