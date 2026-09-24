"""Olymp integration placeholder: do not import unverified services or prices."""

from base import BaseParser


class OlympClinicParser(BaseParser):
    def __init__(self):
        super().__init__()
        self.base_url = "https://olymp.kz"

    def parse(self):
        raise RuntimeError(
            "Olymp live price extraction is not configured; no data was imported"
        )


if __name__ == "__main__":
    OlympClinicParser().parse()
