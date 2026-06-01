from pydantic import BaseModel, Field, EmailStr
from typing import List
from decimal import Decimal
from datetime import datetime

# ----------------- PRODUCT SCHEMAS -----------------
class ProductBase(BaseModel):
    sku: str = Field(..., min_length=1, description="Unique SKU code of the product")
    name: str = Field(..., min_length=1, description="Name of the product")
    price: Decimal = Field(..., gt=0, decimal_places=2, description="Price must be greater than 0")
    quantity_in_stock: int = Field(..., ge=0, description="Quantity in stock must be non-negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: str | None = Field(None, min_length=1)
    name: str | None = Field(None, min_length=1)
    price: Decimal | None = Field(None, gt=0, decimal_places=2)
    quantity_in_stock: int | None = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# ----------------- CUSTOMER SCHEMAS -----------------
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, description="Full name of the customer")
    email: EmailStr = Field(..., description="Unique email address")
    phone: str = Field(..., min_length=1, description="Contact phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ----------------- ORDER ITEM SCHEMAS -----------------
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity ordered must be greater than 0")

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    price_at_order: Decimal
    product: ProductResponse

    class Config:
        from_attributes = True


# ----------------- ORDER SCHEMAS -----------------
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least 1 item")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: CustomerResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# ----------------- DASHBOARD SCHEMAS -----------------
class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]
