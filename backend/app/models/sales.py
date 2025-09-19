from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum
import json

class PaymentMethod(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    MOBILE_PAYMENT = "mobile_payment"

class SaleStatus(str, Enum):
    COMPLETED = "completed"
    PARTIAL_PAYMENT = "partial_payment"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"
    CANCELLED = "cancelled"

class SaleItem(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = Field(..., gt=0)
    price: float = Field(..., gt=0)
    product_name: Optional[str] = None  # For easier tracking

    @field_validator('quantity')
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v

    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v

class SaleBase(BaseModel):
    customer_id: Optional[str] = None
    items: List[SaleItem] = Field(..., min_length=1)
    subtotal: float = Field(..., ge=0)
    total: float = Field(..., gt=0)
    payment_method: PaymentMethod
    cashier_id: str
    timestamp: Optional[str] = None
    status: SaleStatus = SaleStatus.COMPLETED
    paid_amount: Optional[float] = Field(None, ge=0)
    remaining_amount: Optional[float] = Field(None, ge=0)

    @field_validator('items', mode='before')
    @classmethod
    def parse_items(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        elif v is None:
            return []
        return v
    
    @field_validator('cashier_id', mode='before')
    @classmethod
    def parse_cashier_id(cls, v):
        return str(v) if v is not None else ''

    @field_validator('total')
    @classmethod
    def total_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Total must be greater than 0')
        return v

    @field_validator('subtotal')
    @classmethod
    def subtotal_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Subtotal must be non-negative')
        return v

class SaleCreate(SaleBase):
    pass

class SaleUpdate(BaseModel):
    status: Optional[SaleStatus] = None
    paid_amount: Optional[float] = Field(None, ge=0)
    remaining_amount: Optional[float] = Field(None, ge=0)
    items: Optional[List[SaleItem]] = None
    cashier_id: Optional[str] = None

    @field_validator('items', mode='before')
    @classmethod
    def parse_items(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        elif v is None:
            return None
        return v
    
    @field_validator('cashier_id', mode='before')
    @classmethod
    def parse_cashier_id(cls, v):
        return str(v) if v is not None else None

class Sale(SaleBase):
    id: str

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Sale] = None

class SaleListResponse(BaseModel):
    success: bool
    message: str
    data: List[Sale]
    total: int

class SalesAnalytics(BaseModel):
    total_sales: float
    total_transactions: int
    average_order_value: float
    top_products: List[dict]
    sales_by_payment_method: dict
    sales_by_day: dict
    revenue_trend: List[dict]

class AnalyticsResponse(BaseModel):
    success: bool
    message: str
    data: SalesAnalytics