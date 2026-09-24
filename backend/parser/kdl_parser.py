"""KDL integration placeholder: do not import guessed service names or prices."""

from base import BaseParser


class KDLParser(BaseParser):
    def __init__(self):
        super().__init__()
        self.base_url = "https://kdlolymp.kz"

    def parse(self):
        raise RuntimeError(
            "KDL live price extraction is not configured; no data was imported"
        )


if __name__ == "__main__":
    KDLParser().parse()
