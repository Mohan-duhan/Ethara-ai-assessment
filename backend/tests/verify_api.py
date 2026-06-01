import sys
import unittest
import json
from fastapi.testclient import TestClient

# Adjust path to import backend app
sys.path.append("..")
try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
except ImportError:
    # If run from root or tests dir
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app.main import app
    from app.database import Base, engine, SessionLocal

class TestInventorySystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # We can use the default engine or configure a test sqlite DB if needed,
        # but to keep it simple and test backend logic, TestClient works with whatever database is configured.
        # Let's ensure the tables are initialized
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def setUp(self):
        # Reset DB tables before each test to have consistent IDs
        # To avoid deleting real user data, we only run tests when explicitly called,
        # or we delete test products/customers/orders.
        # Let's clean up our test records specifically.
        # We can identify them by SKU/Email prefixes or clear them out.
        self.db.execute(Base.metadata.tables['order_items'].delete())
        self.db.execute(Base.metadata.tables['orders'].delete())
        self.db.execute(Base.metadata.tables['products'].delete())
        self.db.execute(Base.metadata.tables['customers'].delete())
        self.db.commit()

    def test_product_lifecycle_and_constraints(self):
        # 1. Create a product
        prod_payload = {
            "sku": "TST-001",
            "name": "Test Widget",
            "price": 19.99,
            "quantity_in_stock": 10
        }
        res = self.client.post("/api/products", json=prod_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["sku"], "TST-001")
        self.assertEqual(data["name"], "Test Widget")
        self.assertEqual(float(data["price"]), 19.99)
        self.assertEqual(data["quantity_in_stock"], 10)
        prod_id = data["id"]

        # 2. Verify duplicate SKU block
        res_dup = self.client.post("/api/products", json=prod_payload)
        self.assertEqual(res_dup.status_code, 400)
        self.assertIn("SKU 'TST-001' already exists", res_dup.json()["detail"])

        # 3. Retrieve all products
        res_list = self.client.get("/api/products")
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 1)

        # 4. Retrieve single product
        res_single = self.client.get(f"/api/products/{prod_id}")
        self.assertEqual(res_single.status_code, 200)
        self.assertEqual(res_single.json()["sku"], "TST-001")

        # 5. Update product price and stock
        update_payload = {
            "price": 24.99,
            "quantity_in_stock": 15
        }
        res_up = self.client.put(f"/api/products/{prod_id}", json=update_payload)
        self.assertEqual(res_up.status_code, 200)
        self.assertEqual(float(res_up.json()["price"]), 24.99)
        self.assertEqual(res_up.json()["quantity_in_stock"], 15)

        # 6. Negative stock check
        invalid_update = {
            "quantity_in_stock": -5
        }
        res_inv = self.client.put(f"/api/products/{prod_id}", json=invalid_update)
        self.assertEqual(res_inv.status_code, 422) # Unprocessable Entity validation

    def test_customer_creation(self):
        # 1. Create Customer
        cust_payload = {
            "name": "Alice Smith",
            "email": "alice@example.com",
            "phone": "+155512345"
        }
        res = self.client.post("/api/customers", json=cust_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["name"], "Alice Smith")
        self.assertEqual(data["email"], "alice@example.com")
        cust_id = data["id"]

        # 2. Email uniqueness check
        res_dup = self.client.post("/api/customers", json=cust_payload)
        self.assertEqual(res_dup.status_code, 400)
        self.assertIn("email 'alice@example.com' already exists", res_dup.json()["detail"])

        # 3. Retrieve list
        res_list = self.client.get("/api/customers")
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.json()), 1)

    def test_order_creation_deduction_restoration(self):
        # 1. Setup product and customer
        prod_res = self.client.post("/api/products", json={
            "sku": "TST-002",
            "name": "Gadget B",
            "price": 100.00,
            "quantity_in_stock": 5
        })
        prod_id = prod_res.json()["id"]

        cust_res = self.client.post("/api/customers", json={
            "name": "Bob Jones",
            "email": "bob@example.com",
            "phone": "+155598765"
        })
        cust_id = cust_res.json()["id"]

        # 2. Place order with valid quantity
        order_payload = {
            "customer_id": cust_id,
            "items": [
                {"product_id": prod_id, "quantity": 3}
            ]
        }
        order_res = self.client.post("/api/orders", json=order_payload)
        self.assertEqual(order_res.status_code, 201)
        order_data = order_res.json()
        self.assertEqual(float(order_data["total_amount"]), 300.00) # 3 * $100.00
        order_id = order_data["id"]

        # 3. Verify stock deduction
        prod_check = self.client.get(f"/api/products/{prod_id}")
        self.assertEqual(prod_check.json()["quantity_in_stock"], 2) # 5 - 3 = 2

        # 4. Verify insufficient stock block
        bad_order_payload = {
            "customer_id": cust_id,
            "items": [
                {"product_id": prod_id, "quantity": 5} # Only 2 left
            ]
        }
        bad_res = self.client.post("/api/orders", json=bad_order_payload)
        self.assertEqual(bad_res.status_code, 400)
        self.assertIn("Insufficient stock", bad_res.json()["detail"])

        # 5. Cancel order and verify stock restoration
        cancel_res = self.client.delete(f"/api/orders/{order_id}")
        self.assertEqual(cancel_res.status_code, 200)

        prod_restored = self.client.get(f"/api/products/{prod_id}")
        self.assertEqual(prod_restored.json()["quantity_in_stock"], 5) # Restored back to 5!

if __name__ == "__main__":
    unittest.main()
