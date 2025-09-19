import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    app_name: str = "Boutique POS API"
    version: str = "1.0.0"
    debug: bool = True
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8001
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Database (CSV) Settings
    data_dir: str = "data"
    products_file: str = "products.csv"
    customers_file: str = "customers.csv"
    sales_file: str = "sales.csv"
    users_file: str = "users.csv"
    
    # CORS Settings
    allowed_origins: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://10.234.160.43:8080",
        "*"  # Allow all origins for development
    ]
    
    class Config:
        env_file = ".env"

    def get_csv_path(self, filename: str) -> str:
        """Get full path to CSV file"""
        return os.path.join(self.data_dir, filename)

settings = Settings()