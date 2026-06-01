import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/inventory_db"
    )
    PROJECT_NAME: str = "Inventory & Order Management API"
    PROJECT_VERSION: str = "1.0.0"

settings = Settings()
