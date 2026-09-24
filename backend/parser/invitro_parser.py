"""Invitro integration placeholder: never publish invented prices as live data."""

from base import BaseParser


class InvitroParser(BaseParser):
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.invitro.kz"

    def parse(self):
        raise RuntimeError(
            "Invitro live price extraction is not configured; no data was imported"
        )


if __name__ == "__main__":
    InvitroParser().parse()
