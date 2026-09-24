"""Legacy seed entry point; synthetic offers and promo codes were removed."""

from seed_real_data import seed_db


def seed_features() -> None:
    seed_db()


if __name__ == "__main__":
    seed_features()
