from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageOps

# Run this script from any directory. It finds the project root from this file.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"
OUTPUT_DIR = PROJECT_ROOT / "optimized-webp"
SOURCE_DIRS = [
    PUBLIC_DIR / "uploads",
    PUBLIC_DIR / "media" / "products",
]
SUPPORTED = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
MAX_WIDTH = 1000
MAX_HEIGHT = 1000
QUALITY = 78


def convert_one(source: Path, source_root: Path) -> tuple[int, int, Path]:
    relative = source.relative_to(source_root)
    output = OUTPUT_DIR / source_root.name / relative.with_suffix(".webp")
    output.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)

        # Keep transparent backgrounds transparent; otherwise save as RGB.
        if image.mode in ("RGBA", "LA") or "transparency" in image.info:
            image = image.convert("RGBA")
        else:
            image = image.convert("RGB")

        image.save(output, "WEBP", quality=QUALITY, method=6)

    return source.stat().st_size, output.stat().st_size, output


def main() -> None:
    sources: list[tuple[Path, Path]] = []
    for folder in SOURCE_DIRS:
        if not folder.exists():
            print(f"تخطي مجلد غير موجود: {folder.relative_to(PROJECT_ROOT)}")
            continue
        for path in folder.rglob("*"):
            if path.is_file() and path.suffix.lower() in SUPPORTED:
                sources.append((path, folder))

    if not sources:
        print("لم أجد صور PNG/JPG في مجلدي public/uploads أو public/media/products.")
        return

    total_before = 0
    total_after = 0
    print(f"سأحوّل {len(sources)} صورة. الأصلية ستظل كما هي.")

    for index, (source, source_root) in enumerate(sources, start=1):
        before, after, output = convert_one(source, source_root)
        total_before += before
        total_after += after
        saved = max(0, round((1 - after / before) * 100)) if before else 0
        print(
            f"[{index}/{len(sources)}] {source.relative_to(PROJECT_ROOT)}"
            f" -> {output.relative_to(PROJECT_ROOT)}"
            f" | {before / 1024:.0f} KB -> {after / 1024:.0f} KB"
            f" | توفير {saved}%"
        )

    print("\nاكتمل التحويل.")
    print(f"مجلد الصور الجديدة: {OUTPUT_DIR}")
    print(f"الحجم قبل: {total_before / (1024 * 1024):.2f} MB")
    print(f"الحجم بعد: {total_after / (1024 * 1024):.2f} MB")
    if total_before:
        saved = max(0, round((1 - total_after / total_before) * 100))
        print(f"التوفير الإجمالي: {saved}%")
    print("لم يتم حذف أو استبدال أي صورة أصلية.")
    print("ملاحظة: يلزم رفع الصور الجديدة وتحديث روابط الموقع لاحقًا حتى تظهر على الموقع المنشور.")


if __name__ == "__main__":
    main()
