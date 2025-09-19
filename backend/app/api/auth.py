from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import UserLogin, Token, User, UserResponse, UserCreate
from app.database.csv_handler import UserCSVHandler
from app.core.security import verify_password, get_password_hash, create_access_token, verify_token
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Initialize CSV handler
users_db = UserCSVHandler()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from token"""
    try:
        username = verify_token(credentials.credentials)
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = users_db.find_by_email(username)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return User(**user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate user by email and password"""
    user = users_db.find_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.get('hashed_password', '')):
        return None
    return user

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Login user and return access token"""
    try:
        user = authenticate_user(user_credentials.email, user_credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.get('is_active', True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        success=True,
        message="User information retrieved successfully",
        data=current_user
    )

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register new user (admin only in production)"""
    try:
        # Check if user already exists
        existing_user = users_db.find_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user data
        user_dict = user_data.dict()
        del user_dict['password']  # Remove plain password
        user_dict['hashed_password'] = hashed_password
        
        # Create user
        created_user = users_db.create(user_dict)
        
        # Remove hashed password from response
        user_response = {k: v for k, v in created_user.items() if k != 'hashed_password'}
        
        return UserResponse(
            success=True,
            message="User registered successfully",
            data=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(status_code=500, detail="User registration failed")

# Initialize default users if none exist
@router.on_event("startup")
async def create_default_users():
    """Create default users if none exist"""
    try:
        all_users = users_db.get_all()
        if not all_users:
            # Create default owner
            default_owner = {
                "name": "Default Owner",
                "email": "owner@boutique.com",
                "role": "owner",
                "permissions": ["pos", "inventory", "reports", "customer_management", "staff_management", "admin", "analytics"],
                "is_active": True,
                "hashed_password": get_password_hash("password123")
            }
            users_db.create(default_owner)
            
            # Create default manager
            default_manager = {
                "name": "Default Manager",
                "email": "manager@boutique.com",
                "role": "manager",
                "permissions": ["pos", "inventory", "reports", "customer_management", "staff_management"],
                "is_active": True,
                "hashed_password": get_password_hash("password123")
            }
            users_db.create(default_manager)
            
            # Create default cashier
            default_cashier = {
                "name": "Default Cashier",
                "email": "cashier@boutique.com",
                "role": "cashier",
                "permissions": ["pos", "customer_lookup"],
                "is_active": True,
                "hashed_password": get_password_hash("password123")
            }
            users_db.create(default_cashier)
            
            logger.info("Default users created successfully")
    except Exception as e:
        logger.error(f"Error creating default users: {str(e)}")