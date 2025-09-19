from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import json

class ProductVariant(BaseModel):
    id: str
    size: str
    color: str
    stock: int = Field(ge=0)
    sku: str

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    cost: float = Field(..., ge=0)
    stock: int = Field(..., ge=0)
    sku: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    image: Optional[str] = Field(None, max_length=500)
    variants: Optional[List[ProductVariant]] = []

    @field_validator('variants', mode='before')
    @classmethod
    def parse_variants(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        elif v is None:
            return []
        return v

    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v

    @field_validator('cost')
    @classmethod
    def cost_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Cost must be non-negative')
        return v

    @field_validator('stock')
    @classmethod
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Stock must be non-negative')
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    cost: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=1000)
    image: Optional[str] = Field(None, max_length=500)
    variants: Optional[List[ProductVariant]] = None

    @field_validator('variants', mode='before')
    @classmethod
    def parse_variants(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        elif v is None:
            return []
        return v

class Product(ProductBase):
    id: str

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Product] = None

class ProductListResponse(BaseModel):
    success: bool
    message: str
    data: List[Product]
    total: int