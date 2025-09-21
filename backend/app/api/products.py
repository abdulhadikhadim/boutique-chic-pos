from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile
from app.models.product import (
    Product, ProductCreate, ProductUpdate, ProductResponse, 
    ProductListResponse
)
from app.database.csv_handler import ProductCSVHandler
import logging
import base64
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize CSV handler
products_db = ProductCSVHandler()

@router.get("/", response_model=ProductListResponse)
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Get all products with optional filtering"""
    try:
        all_products = products_db.get_all()
        
        # Apply filters
        if category:
            all_products = [p for p in all_products if p.get('category', '').lower() == category.lower()]
        
        if search:
            search_lower = search.lower()
            all_products = [
                p for p in all_products 
                if search_lower in p.get('name', '').lower() 
                or search_lower in p.get('sku', '').lower()
                or search_lower in p.get('description', '').lower()
            ]
        
        # Apply pagination
        total = len(all_products)
        products = all_products[skip:skip + limit]
        
        return ProductListResponse(
            success=True,
            message=f"Retrieved {len(products)} products",
            data=products,
            total=total
        )
    except Exception as e:
        logger.error(f"Error retrieving products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving products: {str(e)}")

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get product by ID"""
    try:
        product = products_db.find_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return ProductResponse(
            success=True,
            message="Product retrieved successfully",
            data=product
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving product: {str(e)}")

@router.post("/", response_model=ProductResponse)
async def create_product(product: ProductCreate):
    """Create new product"""
    try:
        # Check if SKU already exists
        existing_product = products_db.find_by_sku(product.sku)
        if existing_product:
            raise HTTPException(status_code=400, detail="Product with this SKU already exists")
        
        # Convert Pydantic model to dict
        product_data = product.dict()
        
        # Create product
        created_product = products_db.create(product_data)
        
        return ProductResponse(
            success=True,
            message="Product created successfully",
            data=created_product
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product_update: ProductUpdate):
    """Update existing product"""
    try:
        # Check if product exists
        existing_product = products_db.find_by_id(product_id)
        if not existing_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if new SKU conflicts with another product
        if product_update.sku:
            existing_sku = products_db.find_by_sku(product_update.sku)
            if existing_sku and existing_sku['id'] != product_id:
                raise HTTPException(status_code=400, detail="Product with this SKU already exists")
        
        # Convert to dict and filter out None values
        update_data = {k: v for k, v in product_update.dict().items() if v is not None}
        
        # Update product
        updated_product = products_db.update(product_id, update_data)
        
        return ProductResponse(
            success=True,
            message="Product updated successfully",
            data=updated_product
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")

@router.delete("/{product_id}")
async def delete_product(product_id: str):
    """Delete product"""
    try:
        # Check if product exists
        existing_product = products_db.find_by_id(product_id)
        if not existing_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Delete product
        success = products_db.delete(product_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete product")
        
        return {
            "success": True,
            "message": "Product deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")

@router.get("/sku/{sku}", response_model=ProductResponse)
async def get_product_by_sku(sku: str):
    """Get product by SKU"""
    try:
        product = products_db.find_by_sku(sku)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return ProductResponse(
            success=True,
            message="Product retrieved successfully",
            data=product
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving product by SKU {sku}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving product: {str(e)}")

@router.get("/categories/", response_model=dict)
async def get_categories():
    """Get all unique categories"""
    try:
        all_products = products_db.get_all()
        categories = list(set(p.get('category', '') for p in all_products if p.get('category')))
        
        return {
            "success": True,
            "message": "Categories retrieved successfully",
            "data": sorted(categories)
        }
    except Exception as e:
        logger.error(f"Error retrieving categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving categories: {str(e)}")

@router.get("/low-stock/", response_model=ProductListResponse)
async def get_low_stock_products(threshold: int = Query(10, ge=0)):
    """Get products with low stock"""
    try:
        all_products = products_db.get_all()
        low_stock_products = [
            p for p in all_products 
            if p.get('stock', 0) <= threshold and p.get('stock', 0) > 0
        ]
        
        return ProductListResponse(
            success=True,
            message=f"Retrieved {len(low_stock_products)} low stock products",
            data=low_stock_products,
            total=len(low_stock_products)
        )
    except Exception as e:
        logger.error(f"Error retrieving low stock products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving low stock products: {str(e)}")

@router.get("/out-of-stock/", response_model=ProductListResponse)
async def get_out_of_stock_products():
    """Get products that are out of stock"""
    try:
        all_products = products_db.get_all()
        out_of_stock_products = [
            p for p in all_products 
            if p.get('stock', 0) == 0
        ]
        
        return ProductListResponse(
            success=True,
            message=f"Retrieved {len(out_of_stock_products)} out of stock products",
            data=out_of_stock_products,
            total=len(out_of_stock_products)
        )
    except Exception as e:
        logger.error(f"Error retrieving out of stock products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving out of stock products: {str(e)}")

@router.post("/upload-image/")
async def upload_product_image(file: UploadFile = File(...)):
    """Upload product image and return base64 encoded string"""
    try:
        # Check file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Check file size (limit to 10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed.")
        
        # Convert to base64
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Create data URL with proper MIME type
        data_url = f"data:{file.content_type};base64,{base64_image}"
        
        return {
            "success": True,
            "message": "Image uploaded successfully",
            "data": {
                "image": data_url,
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(contents)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")