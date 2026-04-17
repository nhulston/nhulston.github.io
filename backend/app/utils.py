import re
import unicodedata


def slugify_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    collapsed = re.sub(r"[^a-zA-Z0-9]+", "-", normalized.lower()).strip("-")
    return collapsed or "post"

