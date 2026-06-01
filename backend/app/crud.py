from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from decimal import Decimal
from . import models, schemas

# Custom Exceptions for clean error translation in routes
class SKUExistsException(Exception):
    def __init__(self, sku: str):
        self.sku = sku
        super().__init__(f"Product with SKU '{sku}' already exists.")

class EmailExistsException(Exception):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"Customer with email '{email}' already exists.")

class InsufficientStockException(Exception):
    def __init__(self, product_name: str, requested: int, available: int):
        self.product_name = product_name
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for '{product_name}'. Requested: {requested}, Available: {available}."
        )


# ----------------- PRODUCT CRUD -----------------
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    existing = get_product_by_sku(db, product.sku)
    if existing:
        raise SKUExistsException(product.sku)
    
    db_product = models.Product(
        sku=product.sku,
        name=product.name,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        existing = get_product_by_sku(db, update_data["sku"])
        if existing:
            raise SKUExistsException(update_data["sku"])
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product


# ----------------- CUSTOMER CRUD -----------------
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    existing = get_customer_by_email(db, customer.email)
    if existing:
        raise EmailExistsException(customer.email)
        
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer


# ----------------- ORDER CRUD -----------------
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # Verify customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_data.customer_id} not found."
        )
    
    # We will use a database transaction context by committing at the end, or rollback if failure
    total_amount = Decimal("0.00")
    order_items_to_create = []
    products_to_update = []
    
    try:
        # 1. Validate all items and quantities, calculate prices
        for item in order_data.items:
            # Query product (with locking for write if needed, or simple query in standard transactions)
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} not found."
                )
            
            if product.quantity_in_stock < item.quantity:
                raise InsufficientStockException(product.name, item.quantity, product.quantity_in_stock)
            
            # Deduct stock
            product.quantity_in_stock -= item.quantity
            products_to_update.append(product)
            
            # Calculate pricing
            price_at_order = product.price
            item_total = price_at_order * item.quantity
            total_amount += item_total
            
            # Create OrderItem object
            order_item = models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                price_at_order=price_at_order
            )
            order_items_to_create.append(order_item)
        
        # 2. Save Order record
        db_order = models.Order(
            customer_id=order_data.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush() # Populate db_order.id
        
        # 3. Associate and save order items
        for order_item in order_items_to_create:
            order_item.order_id = db_order.id
            db.add(order_item)
            
        # Commit transaction (updates products and saves order + items)
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except Exception as e:
        db.rollback()
        raise e

def delete_order(db: Session, order_id: int):
    # Retrieve order with lock to prevent race conditions during deletion
    db_order = db.query(models.Order).filter(models.Order.id == order_id).with_for_update().first()
    if not db_order:
        return None
        
    try:
        # Serialize the order with all relationships loaded before deleting it
        order_response = schemas.OrderResponse.model_validate(db_order)
        
        # Restore stock to products
        for item in db_order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity_in_stock += item.quantity
        
        # Delete order (cascades to order items)
        db.delete(db_order)
        db.commit()
        return order_response
    except Exception as e:
        db.rollback()
        raise e


# ----------------- DASHBOARD CRUD -----------------
def get_dashboard_summary(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Low stock limit: < 5 items in stock
    low_stock_products = db.query(models.Product).filter(models.Product.quantity_in_stock < 5).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }
