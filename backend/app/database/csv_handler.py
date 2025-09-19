import os
import pandas as pd
import json
from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime
from app.core.config import settings

class CSVHandler:
    """Base CSV handler for all data operations"""
    
    def __init__(self, filename: str):
        self.filename = filename
        self.filepath = settings.get_csv_path(filename)
        self.ensure_data_directory()
        self.ensure_file_exists()
    
    def ensure_data_directory(self):
        """Ensure data directory exists"""
        os.makedirs(settings.data_dir, exist_ok=True)
    
    def ensure_file_exists(self):
        """Ensure CSV file exists with headers"""
        if not os.path.exists(self.filepath):
            # Create empty CSV with headers based on file type
            headers = self.get_default_headers()
            df = pd.DataFrame(columns=headers)
            df.to_csv(self.filepath, index=False)
    
    def get_default_headers(self) -> List[str]:
        """Get default headers for the CSV file"""
        # This will be overridden by specific handlers
        return []
    
    def read_all(self) -> pd.DataFrame:
        """Read all data from CSV"""
        try:
            # Read with string dtype for id columns to avoid int conversion
            # Also handle other potential ID fields
            dtype_dict = {
                'id': 'str',
                'product_id': 'str', 
                'customer_id': 'str',
                'cashier_id': 'str',
                'variant_id': 'str'
            }
            df = pd.read_csv(self.filepath, dtype=dtype_dict, keep_default_na=False, na_values=[])
            return df
        except pd.errors.EmptyDataError:
            return pd.DataFrame(columns=self.get_default_headers())
    
    def save_dataframe(self, df: pd.DataFrame):
        """Save dataframe to CSV"""
        df.to_csv(self.filepath, index=False)
    
    def find_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Find record by ID"""
        df = self.read_all()
        if df.empty:
            return None
        
        record = df[df['id'] == record_id]
        if record.empty:
            return None
        
        return record.iloc[0].to_dict()
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new record"""
        if 'id' not in data:
            data['id'] = str(uuid4())
        
        df = self.read_all()
        new_record = pd.DataFrame([data])
        df = pd.concat([df, new_record], ignore_index=True)
        self.save_dataframe(df)
        
        return data
    
    def update(self, record_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update existing record"""
        df = self.read_all()
        if df.empty:
            return None
        
        mask = df['id'] == record_id
        if not mask.any():
            return None
        
        # Update fields
        for key, value in data.items():
            if key != 'id':  # Don't allow ID updates
                df.loc[mask, key] = value
        
        self.save_dataframe(df)
        
        # Return updated record
        updated_record = df[mask].iloc[0].to_dict()
        return updated_record
    
    def delete(self, record_id: str) -> bool:
        """Delete record by ID"""
        df = self.read_all()
        if df.empty:
            return False
        
        initial_length = len(df)
        df = df[df['id'] != record_id]
        
        if len(df) == initial_length:
            return False  # No record was deleted
        
        self.save_dataframe(df)
        return True
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Get all records as list of dictionaries"""
        df = self.read_all()
        if df.empty:
            return []
        
        return df.to_dict('records')

class ProductCSVHandler(CSVHandler):
    """CSV handler for products"""
    
    def __init__(self):
        super().__init__(settings.products_file)
    
    def get_default_headers(self) -> List[str]:
        return ['id', 'name', 'category', 'price', 'cost', 'stock', 'sku', 'description', 'image', 'variants']
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create product with variants handling"""
        # Handle variants as JSON string for CSV storage
        if 'variants' in data:
            if isinstance(data['variants'], list):
                data['variants'] = json.dumps(data['variants'])
            elif isinstance(data['variants'], str):
                # If it's already a string, validate it's proper JSON
                try:
                    json.loads(data['variants'])
                except (json.JSONDecodeError, TypeError):
                    data['variants'] = '[]'
            else:
                data['variants'] = '[]'
        
        created_record = super().create(data)
        
        # Process the record to ensure proper format for response
        return self._process_product_record(created_record)
    
    def update(self, record_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update product with variants handling"""
        # Handle variants as JSON string for storage
        if 'variants' in data:
            if isinstance(data['variants'], list):
                data['variants'] = json.dumps(data['variants'])
            elif isinstance(data['variants'], str):
                # If it's already a string, validate it's proper JSON
                try:
                    json.loads(data['variants'])
                except (json.JSONDecodeError, TypeError):
                    data['variants'] = '[]'
            else:
                data['variants'] = '[]'
        
        # Update the record
        updated_record = super().update(record_id, data)
        if updated_record is None:
            return None
        
        # Process the record to ensure proper format for response
        return self._process_product_record(updated_record)
    
    def find_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Find product by ID with proper record processing"""
        record = super().find_by_id(record_id)
        if record is None:
            return None
        
        # Process the record to ensure proper format for response
        return self._process_product_record(record)
    
    def find_by_sku(self, sku: str) -> Optional[Dict[str, Any]]:
        """Find product by SKU"""
        df = self.read_all()
        if df.empty:
            return None
        
        record = df[df['sku'] == sku]
        if record.empty:
            return None
        
        return self._process_product_record(record.iloc[0].to_dict())
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Get all products with variants parsed"""
        df = self.read_all()
        if df.empty:
            return []
        
        products = []
        for _, row in df.iterrows():
            products.append(self._process_product_record(row.to_dict()))
        
        return products
    
    def _process_product_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Process product record to parse variants and ensure proper data types"""
        # Handle NaN values for fields
        for key, value in record.items():
            if pd.isna(value) or value == 'nan' or str(value).lower() == 'nan':
                if key in ['description', 'image']:
                    record[key] = ''
                elif key in ['price', 'cost']:
                    record[key] = 0.0
                elif key in ['stock']:
                    record[key] = 0
                else:
                    record[key] = None
        
        # Ensure ID is string
        if 'id' in record:
            record['id'] = str(record['id'])
        
        # Ensure numeric fields are proper types
        for field in ['price', 'cost']:
            if field in record and record[field] is not None:
                try:
                    record[field] = float(record[field])
                except (ValueError, TypeError):
                    record[field] = 0.0
        
        if 'stock' in record and record['stock'] is not None:
            try:
                record['stock'] = int(record['stock'])
            except (ValueError, TypeError):
                record['stock'] = 0
        
        # Handle variants
        if 'variants' in record and isinstance(record['variants'], str):
            try:
                record['variants'] = json.loads(record['variants'])
            except (json.JSONDecodeError, TypeError):
                record['variants'] = []
        elif 'variants' not in record or record['variants'] is None:
            record['variants'] = []
        
        return record

class CustomerCSVHandler(CSVHandler):
    """CSV handler for customers"""
    
    def __init__(self):
        super().__init__(settings.customers_file)
    
    def get_default_headers(self) -> List[str]:
        return ['id', 'first_name', 'last_name', 'email', 'phone', 'address', 'gender', 'alternate_phone', 'loyalty_points', 'total_spent', 'visits', 'last_visit', 'preferences']
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create customer with preferences handling"""
        # Handle preferences as JSON string for storage
        if 'preferences' in data and isinstance(data['preferences'], dict):
            data['preferences'] = json.dumps(data['preferences'])
        
        # Create the record
        created_record = super().create(data)
        
        # Process the record to ensure proper format for response
        return self._process_customer_record(created_record)
    
    def update(self, record_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update customer with preferences handling"""
        # Handle preferences as JSON string for storage
        if 'preferences' in data and isinstance(data['preferences'], dict):
            data['preferences'] = json.dumps(data['preferences'])
        
        # Update the record
        updated_record = super().update(record_id, data)
        if updated_record is None:
            return None
        
        # Process the record to ensure proper format for response
        return self._process_customer_record(updated_record)
    
    def find_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Find customer by ID with proper record processing"""
        record = super().find_by_id(record_id)
        if record is None:
            return None
        
        # Process the record to ensure proper format for response
        return self._process_customer_record(record)
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Get all customers with preferences parsed"""
        df = self.read_all()
        if df.empty:
            return []
        
        customers = []
        for _, row in df.iterrows():
            customers.append(self._process_customer_record(row.to_dict()))
        
        return customers
    
    def _process_customer_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Process customer record to parse preferences and handle NaN values"""
        # Handle NaN values, empty strings, and convert to appropriate types
        for key, value in record.items():
            if pd.isna(value) or value == 'nan' or str(value).lower() == 'nan' or value == '':
                if key in ['alternate_phone', 'email', 'address', 'gender', 'last_visit']:
                    record[key] = None
                elif key in ['loyalty_points', 'visits']:
                    record[key] = 0
                elif key in ['total_spent']:
                    record[key] = 0.0
                else:
                    record[key] = None
        
        # Ensure ID is string
        if 'id' in record:
            record['id'] = str(record['id'])
        
        # Ensure numeric fields are proper types
        if 'loyalty_points' in record:
            try:
                record['loyalty_points'] = int(record['loyalty_points']) if record['loyalty_points'] is not None else 0
            except (ValueError, TypeError):
                record['loyalty_points'] = 0
        
        if 'total_spent' in record:
            try:
                record['total_spent'] = float(record['total_spent']) if record['total_spent'] is not None else 0.0
            except (ValueError, TypeError):
                record['total_spent'] = 0.0
        
        if 'visits' in record:
            try:
                record['visits'] = int(record['visits']) if record['visits'] is not None else 0
            except (ValueError, TypeError):
                record['visits'] = 0
        
        # Handle preferences
        if 'preferences' in record and isinstance(record['preferences'], str):
            try:
                record['preferences'] = json.loads(record['preferences'])
            except (json.JSONDecodeError, TypeError):
                record['preferences'] = {}
        elif 'preferences' not in record or record['preferences'] is None:
            record['preferences'] = {}
        
        return record

class SalesCSVHandler(CSVHandler):
    """CSV handler for sales"""
    
    def __init__(self):
        super().__init__(settings.sales_file)
    
    def get_default_headers(self) -> List[str]:
        return ['id', 'customer_id', 'items', 'subtotal', 'total', 'payment_method', 'cashier_id', 'timestamp', 'status', 'paid_amount', 'remaining_amount']
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create sale with items handling"""
        # Handle items as JSON string
        if 'items' in data and isinstance(data['items'], list):
            data['items'] = json.dumps(data['items'])
        
        # Add timestamp if not provided
        if 'timestamp' not in data:
            data['timestamp'] = datetime.utcnow().isoformat()
        
        # Handle partial payment logic
        if 'paid_amount' in data and 'total' in data:
            paid_amount = float(data.get('paid_amount', 0))
            total = float(data.get('total', 0))
            
            if paid_amount >= total:
                # Full payment
                data['status'] = 'completed'
                data['remaining_amount'] = 0
                data['paid_amount'] = total
            else:
                # Partial payment
                data['status'] = 'partial_payment'
                data['remaining_amount'] = total - paid_amount
        
        # Create the record
        created_record = super().create(data)
        
        # Process the record to ensure proper format for response
        return self._process_sale_record(created_record)
    
    def update(self, record_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update sale with items handling"""
        # Handle items as JSON string for storage
        if 'items' in data and isinstance(data['items'], list):
            data['items'] = json.dumps(data['items'])
        
        # Update the record
        updated_record = super().update(record_id, data)
        if updated_record is None:
            return None
        
        # Process the record to ensure proper format for response
        return self._process_sale_record(updated_record)
    
    def find_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Find sale by ID with proper record processing"""
        record = super().find_by_id(record_id)
        if record is None:
            return None
        
        # Process the record to ensure proper format for response
        return self._process_sale_record(record)
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Get all sales with items parsed"""
        df = self.read_all()
        if df.empty:
            return []
        
        sales = []
        for _, row in df.iterrows():
            sales.append(self._process_sale_record(row.to_dict()))
        
        return sales
    
    def _process_sale_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Process sale record to parse items and ensure proper data types"""
        # Handle NaN values for new fields
        for key, value in record.items():
            if pd.isna(value) or value == 'nan' or str(value).lower() == 'nan':
                if key in ['customer_id', 'timestamp']:
                    record[key] = None
                elif key in ['paid_amount', 'remaining_amount']:
                    record[key] = 0.0
                else:
                    record[key] = None
        
        # Ensure ID and cashier_id are strings
        if 'id' in record:
            record['id'] = str(record['id'])
        if 'cashier_id' in record:
            record['cashier_id'] = str(record['cashier_id'])
        
        # Ensure numeric fields are proper types
        for field in ['subtotal', 'total', 'paid_amount', 'remaining_amount']:
            if field in record and record[field] is not None:
                try:
                    record[field] = float(record[field])
                except (ValueError, TypeError):
                    record[field] = 0.0
        
        # Handle items
        if 'items' in record and isinstance(record['items'], str):
            try:
                record['items'] = json.loads(record['items'])
            except (json.JSONDecodeError, TypeError):
                record['items'] = []
        elif 'items' not in record or record['items'] is None:
            record['items'] = []
        
        return record

class UserCSVHandler(CSVHandler):
    """CSV handler for users"""
    
    def __init__(self):
        super().__init__(settings.users_file)
    
    def get_default_headers(self) -> List[str]:
        return ['id', 'name', 'email', 'role', 'permissions', 'is_active', 'hashed_password']
    
    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create user with permissions handling"""
        # Handle permissions as JSON string
        if 'permissions' in data and isinstance(data['permissions'], list):
            data['permissions'] = json.dumps(data['permissions'])
        
        return super().create(data)
    
    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find user by email"""
        df = self.read_all()
        if df.empty:
            return None
        
        record = df[df['email'] == email]
        if record.empty:
            return None
        
        return self._process_user_record(record.iloc[0].to_dict())
    
    def get_all(self) -> List[Dict[str, Any]]:
        """Get all users with permissions parsed"""
        df = self.read_all()
        if df.empty:
            return []
        
        users = []
        for _, row in df.iterrows():
            users.append(self._process_user_record(row.to_dict()))
        
        return users
    
    def _process_user_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Process user record to parse permissions and ensure proper data types"""
        # Ensure ID is string
        if 'id' in record:
            record['id'] = str(record['id'])
        
        # Handle permissions
        if 'permissions' in record and isinstance(record['permissions'], str):
            try:
                record['permissions'] = json.loads(record['permissions'])
            except (json.JSONDecodeError, TypeError):
                record['permissions'] = []
        elif 'permissions' not in record or record['permissions'] is None:
            record['permissions'] = []
        
        return record