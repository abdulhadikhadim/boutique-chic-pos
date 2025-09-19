from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from app.models.sales import (
    Sale, SaleCreate, SaleUpdate, SaleResponse, 
    SaleListResponse, SalesAnalytics, AnalyticsResponse
)
from app.database.csv_handler import SalesCSVHandler, ProductCSVHandler, CustomerCSVHandler
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize CSV handlers
sales_db = SalesCSVHandler()
products_db = ProductCSVHandler()
customers_db = CustomerCSVHandler()

@router.get("/", response_model=SaleListResponse)
async def get_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    cashier_id: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get all sales with optional filtering"""
    try:
        all_sales = sales_db.get_all()
        
        # Apply filters
        if cashier_id:
            all_sales = [s for s in all_sales if s.get('cashier_id') == cashier_id]
        
        if customer_id:
            all_sales = [s for s in all_sales if s.get('customer_id') == customer_id]
        
        if start_date:
            all_sales = [s for s in all_sales if s.get('timestamp', '') >= start_date]
        
        if end_date:
            all_sales = [s for s in all_sales if s.get('timestamp', '') <= end_date]
        
        # Apply pagination
        total = len(all_sales)
        sales = all_sales[skip:skip + limit]
        
        return SaleListResponse(
            success=True,
            message=f"Retrieved {len(sales)} sales",
            data=sales,
            total=total
        )
    except Exception as e:
        logger.error(f"Error retrieving sales: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving sales: {str(e)}")

@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(sale_id: str):
    """Get sale by ID"""
    try:
        sale = sales_db.find_by_id(sale_id)
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        return SaleResponse(
            success=True,
            message="Sale retrieved successfully",
            data=sale
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving sale {sale_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving sale: {str(e)}")

@router.post("/", response_model=SaleResponse)
async def create_sale(sale: SaleCreate):
    """Create new sale and update inventory"""
    try:
        # Validate sale items and update inventory
        for item in sale.items:
            logger.info(f"Looking up product ID: {item.product_id}")
            product = products_db.find_by_id(item.product_id)
            if not product:
                logger.error(f"Product lookup failed for ID: {item.product_id}")
                # Let's also check what products are available
                all_products = products_db.get_all()
                available_ids = [p.get('id') for p in all_products]
                logger.error(f"Available product IDs: {available_ids}")
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
            
            logger.info(f"Found product: {product.get('name', 'Unknown')} (ID: {product.get('id')})")
            current_stock = product.get('stock', 0)
            if current_stock < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for product {product.get('name', item.product_id)}. Available: {current_stock}, Required: {item.quantity}"
                )
            
            # Update product stock
            new_stock = current_stock - item.quantity
            products_db.update(item.product_id, {"stock": new_stock})
        
        # Update customer data if provided
        if sale.customer_id:
            customer = customers_db.find_by_id(sale.customer_id)
            if customer:
                # Update customer stats
                new_total_spent = customer.get('total_spent', 0) + sale.total
                new_visits = customer.get('visits', 0) + 1
                new_loyalty_points = customer.get('loyalty_points', 0) + int(sale.total)  # 1 point per dollar
                
                customers_db.update(sale.customer_id, {
                    "total_spent": new_total_spent,
                    "visits": new_visits,
                    "loyalty_points": new_loyalty_points,
                    "last_visit": datetime.utcnow().isoformat()
                })
        
        # Convert Pydantic model to dict
        sale_data = sale.dict()
        
        # Create sale
        created_sale = sales_db.create(sale_data)
        
        return SaleResponse(
            success=True,
            message="Sale created successfully",
            data=created_sale
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating sale: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating sale: {str(e)}")

@router.put("/{sale_id}", response_model=SaleResponse)
async def update_sale(sale_id: str, sale_update: SaleUpdate):
    """Update existing sale (mainly for status changes)"""
    try:
        # Check if sale exists
        existing_sale = sales_db.find_by_id(sale_id)
        if not existing_sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        # Convert to dict and filter out None values
        update_data = {k: v for k, v in sale_update.dict().items() if v is not None}
        
        # Update sale
        updated_sale = sales_db.update(sale_id, update_data)
        
        return SaleResponse(
            success=True,
            message="Sale updated successfully",
            data=updated_sale
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating sale {sale_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating sale: {str(e)}")

@router.get("/analytics/dashboard", response_model=AnalyticsResponse)
async def get_sales_analytics(
    days: int = Query(30, ge=1, le=365)
):
    """Get comprehensive sales analytics"""
    try:
        all_sales = sales_db.get_all()
        all_products = products_db.get_all()
        
        # Filter sales by date range
        cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        recent_sales = [s for s in all_sales if s.get('timestamp', '') >= cutoff_date]
        
        # Calculate basic metrics
        total_sales = sum(s.get('total', 0) for s in recent_sales)
        total_transactions = len(recent_sales)
        average_order_value = total_sales / total_transactions if total_transactions > 0 else 0
        
        # Top products analysis
        product_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0, "name": ""})
        for sale in recent_sales:
            for item in sale.get('items', []):
                product_id = item.get('product_id')
                quantity = item.get('quantity', 0)
                revenue = item.get('price', 0) * quantity
                
                product_sales[product_id]["quantity"] += quantity
                product_sales[product_id]["revenue"] += revenue
                
                # Get product name
                if not product_sales[product_id]["name"]:
                    product = products_db.find_by_id(product_id)
                    product_sales[product_id]["name"] = product.get('name', 'Unknown') if product else 'Unknown'
        
        # Sort top products by revenue
        top_products = sorted(
            [
                {
                    "product_id": pid,
                    "name": data["name"],
                    "quantity_sold": data["quantity"],
                    "revenue": data["revenue"]
                }
                for pid, data in product_sales.items()
            ],
            key=lambda x: x["revenue"],
            reverse=True
        )[:10]
        
        # Payment method analysis
        payment_methods = Counter(s.get('payment_method', 'unknown') for s in recent_sales)
        sales_by_payment_method = dict(payment_methods)
        
        # Daily sales trend
        daily_sales = defaultdict(float)
        for sale in recent_sales:
            sale_date = sale.get('timestamp', '')[:10]  # Get date part (YYYY-MM-DD)
            daily_sales[sale_date] += sale.get('total', 0)
        
        # Convert to list of dicts for easy frontend consumption
        sales_by_day = dict(daily_sales)
        revenue_trend = [
            {"date": date, "revenue": revenue}
            for date, revenue in sorted(daily_sales.items())
        ]
        
        analytics = SalesAnalytics(
            total_sales=total_sales,
            total_transactions=total_transactions,
            average_order_value=average_order_value,
            top_products=top_products,
            sales_by_payment_method=sales_by_payment_method,
            sales_by_day=sales_by_day,
            revenue_trend=revenue_trend
        )
        
        return AnalyticsResponse(
            success=True,
            message="Sales analytics retrieved successfully",
            data=analytics
        )
    except Exception as e:
        logger.error(f"Error retrieving sales analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving sales analytics: {str(e)}")

@router.get("/reports/daily")
async def get_daily_report(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    """Get daily sales report"""
    try:
        all_sales = sales_db.get_all()
        
        # Filter sales for specific date
        daily_sales = [s for s in all_sales if s.get('timestamp', '')[:10] == date]
        
        # Calculate metrics
        total_revenue = sum(s.get('total', 0) for s in daily_sales)
        total_transactions = len(daily_sales)
        total_items_sold = sum(
            sum(item.get('quantity', 0) for item in s.get('items', []))
            for s in daily_sales
        )
        
        return {
            "success": True,
            "message": f"Daily report for {date}",
            "data": {
                "date": date,
                "total_revenue": total_revenue,
                "total_transactions": total_transactions,
                "total_items_sold": total_items_sold,
                "average_order_value": total_revenue / total_transactions if total_transactions > 0 else 0,
                "sales": daily_sales
            }
        }
    except Exception as e:
        logger.error(f"Error generating daily report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating daily report: {str(e)}")