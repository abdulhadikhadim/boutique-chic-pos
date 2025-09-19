from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class CustomerPreferences(BaseModel):
    size: Optional[str] = None
    style: Optional[List[str]] = []

class CustomerBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    gender: Optional[Gender] = None
    alternate_phone: Optional[str] = Field(None, max_length=20)
    loyalty_points: int = Field(default=0, ge=0)
    total_spent: float = Field(default=0.0, ge=0)
    visits: int = Field(default=0, ge=0)
    last_visit: Optional[str] = None
    preferences: Optional[CustomerPreferences] = Field(default_factory=CustomerPreferences)

    @property
    def name(self) -> str:
        """Full name property for backward compatibility"""
        return f"{self.first_name} {self.last_name}".strip()

    @field_validator('gender', mode='before')
    @classmethod
    def validate_gender(cls, v):
        if v is None or v == '' or str(v).lower() in ['nan', 'none', 'null']:
            return None
        return v
    
    @field_validator('email', 'address', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v is None or v == '' or str(v).lower() in ['nan', 'none', 'null']:
            return None
        return str(v).strip() if v else None
    
    @field_validator('phone', 'alternate_phone', mode='before')
    @classmethod
    def validate_phone(cls, v, info):
        if v is None or v == '' or str(v).lower() in ['nan', 'none', 'null']:
            return None  # Allow empty phone numbers
        if v and not str(v).replace('+', '').replace('-', '').replace('(', '').replace(')', '').replace(' ', '').isdigit():
            raise ValueError('Invalid phone number format')
        return str(v)
    
    @field_validator('first_name', 'last_name', mode='before')
    @classmethod
    def validate_required_strings(cls, v, info):
        if v is None or v == '' or str(v).lower() in ['nan', 'none', 'null']:
            raise ValueError(f'{info.field_name} is required')
        return str(v).strip()
    
    @field_validator('preferences', mode='before')
    @classmethod
    def validate_preferences(cls, v):
        if v is None or v == '' or str(v).lower() in ['nan', 'none', 'null']:
            return CustomerPreferences()
        if isinstance(v, dict):
            return CustomerPreferences(**v)
        if isinstance(v, CustomerPreferences):
            return v
        return CustomerPreferences()

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    gender: Optional[Gender] = None
    alternate_phone: Optional[str] = Field(None, max_length=20)
    loyalty_points: Optional[int] = Field(None, ge=0)
    total_spent: Optional[float] = Field(None, ge=0)
    visits: Optional[int] = Field(None, ge=0)
    last_visit: Optional[str] = None
    preferences: Optional[CustomerPreferences] = None

class Customer(CustomerBase):
    id: str

    class Config:
        from_attributes = True

class CustomerResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Customer] = None

class CustomerListResponse(BaseModel):
    success: bool
    message: str
    data: List[Customer]
    total: int