from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.customer import (
    Customer, CustomerCreate, CustomerUpdate, CustomerResponse, 
    CustomerListResponse
)
from app.database.csv_handler import CustomerCSVHandler
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize CSV handler
customers_db = CustomerCSVHandler()

@router.get("/", response_model=CustomerListResponse)
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None)
):
    """Get all customers with optional search"""
    try:
        all_customers = customers_db.get_all()
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            all_customers = [
                c for c in all_customers 
                if search_lower in c.get('name', '').lower() 
                or search_lower in c.get('email', '').lower()
                or search_lower in c.get('phone', '').lower()
            ]
        
        # Apply pagination
        total = len(all_customers)
        customers = all_customers[skip:skip + limit]
        
        return CustomerListResponse(
            success=True,
            message=f"Retrieved {len(customers)} customers",
            data=customers,
            total=total
        )
    except Exception as e:
        logger.error(f"Error retrieving customers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving customers: {str(e)}")

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str):
    """Get customer by ID"""
    try:
        customer = customers_db.find_by_id(customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return CustomerResponse(
            success=True,
            message="Customer retrieved successfully",
            data=customer
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving customer: {str(e)}")

@router.post("/", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate):
    """Create new customer"""
    try:
        # Convert Pydantic model to dict
        customer_data = customer.dict()
        
        # Create customer
        created_customer = customers_db.create(customer_data)
        
        return CustomerResponse(
            success=True,
            message="Customer created successfully",
            data=created_customer
        )
    except Exception as e:
        logger.error(f"Error creating customer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating customer: {str(e)}")

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer_update: CustomerUpdate):
    """Update existing customer"""
    try:
        # Check if customer exists
        existing_customer = customers_db.find_by_id(customer_id)
        if not existing_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Convert to dict and filter out None values
        update_data = {k: v for k, v in customer_update.dict().items() if v is not None}
        
        # Update customer
        updated_customer = customers_db.update(customer_id, update_data)
        
        return CustomerResponse(
            success=True,
            message="Customer updated successfully",
            data=updated_customer
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating customer: {str(e)}")

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str):
    """Delete customer"""
    try:
        # Check if customer exists
        existing_customer = customers_db.find_by_id(customer_id)
        if not existing_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Delete customer
        success = customers_db.delete(customer_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete customer")
        
        return {
            "success": True,
            "message": "Customer deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting customer: {str(e)}")

@router.get("/loyalty/top/", response_model=CustomerListResponse)
async def get_top_loyalty_customers(limit: int = Query(10, ge=1, le=100)):
    """Get customers with highest loyalty points"""
    try:
        all_customers = customers_db.get_all()
        
        # Sort by loyalty points in descending order
        top_customers = sorted(
            all_customers,
            key=lambda x: x.get('loyalty_points', 0),
            reverse=True
        )[:limit]
        
        return CustomerListResponse(
            success=True,
            message=f"Retrieved top {len(top_customers)} loyalty customers",
            data=top_customers,
            total=len(top_customers)
        )
    except Exception as e:
        logger.error(f"Error retrieving top loyalty customers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving top loyalty customers: {str(e)}")

@router.put("/{customer_id}/loyalty", response_model=CustomerResponse)
async def update_customer_loyalty(customer_id: str, points: int):
    """Update customer loyalty points"""
    try:
        # Check if customer exists
        existing_customer = customers_db.find_by_id(customer_id)
        if not existing_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Update loyalty points
        update_data = {"loyalty_points": max(0, points)}
        updated_customer = customers_db.update(customer_id, update_data)
        
        return CustomerResponse(
            success=True,
            message="Customer loyalty points updated successfully",
            data=updated_customer
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating customer loyalty {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating customer loyalty: {str(e)}")