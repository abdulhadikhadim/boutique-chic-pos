from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from enum import Enum

class UserRole(str, Enum):
    CASHIER = "cashier"
    MANAGER = "manager"
    OWNER = "owner"

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: Optional[str] = None
    role: UserRole
    permissions: List[str] = []
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator('password')
    @classmethod
    def password_validation(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[str] = None
    role: Optional[UserRole] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)

class User(UserBase):
    id: str

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class UserResponse(BaseModel):
    success: bool
    message: str
    data: Optional[User] = None

class UserListResponse(BaseModel):
    success: bool
    message: str
    data: List[User]
    total: int

# Authentication models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str