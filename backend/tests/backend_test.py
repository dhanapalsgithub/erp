"""Backend API tests for Billing & Inventory app."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend .env
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
            break

API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    # ensure seed
    s.post(f"{API}/seed", timeout=30)
    return s


# ---------- Products ----------
class TestProducts:
    def test_list_seeded(self, client):
        r = client.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        data = r.json()
        names = {p["name"] for p in data}
        expected = {"Basmati Rice 5kg", "Sunflower Oil 1L", "Turmeric Powder 500g",
                    "Wheat Flour 10kg", "Sugar 1kg", "Tea Powder 250g"}
        assert expected.issubset(names), f"Missing seeded products: {expected - names}"

    def test_create_and_duplicate_sku(self, client):
        sku = f"TEST-SKU-{int(time.time())}"
        payload = {"name": "TEST_Product", "sku": sku, "price": 100.0, "stock": 50}
        r = client.post(f"{API}/products", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]

        # duplicate SKU
        r2 = client.post(f"{API}/products", json=payload, timeout=30)
        assert r2.status_code == 400

        # update
        r3 = client.put(f"{API}/products/{pid}", json={"price": 150.0}, timeout=30)
        assert r3.status_code == 200
        assert r3.json()["price"] == 150.0

        # delete
        r4 = client.delete(f"{API}/products/{pid}", timeout=30)
        assert r4.status_code == 200


# ---------- Customers ----------
class TestCustomers:
    def test_list_and_create(self, client):
        r = client.get(f"{API}/customers", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 3

        c = client.post(f"{API}/customers",
                        json={"name": "TEST_Customer", "phone": "1234567890"}, timeout=30)
        assert c.status_code == 200
        cid = c.json()["id"]
        client.delete(f"{API}/customers/{cid}", timeout=30)


# ---------- Dashboard ----------
class TestDashboard:
    def test_stats(self, client):
        r = client.get(f"{API}/dashboard/stats", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_sales", "total_invoices", "pending_amount",
                  "low_stock_count", "low_stock_items", "recent_invoices"]:
            assert k in d, f"missing key {k}"
        assert isinstance(d["low_stock_items"], list)


# ---------- Invoice flow ----------
class TestInvoices:
    @pytest.fixture(scope="class")
    def setup(self, client):
        # Create a product with known stock
        sku = f"INVTEST-{int(time.time())}"
        p = client.post(f"{API}/products", json={
            "name": "TEST_InvProduct", "sku": sku,
            "price": 100.0, "stock": 20, "unit": "pcs"
        }, timeout=30).json()
        c = client.post(f"{API}/customers", json={"name": "TEST_InvCustomer"}, timeout=30).json()
        yield {"product": p, "customer": c}
        # cleanup
        client.delete(f"{API}/products/{p['id']}", timeout=30)
        client.delete(f"{API}/customers/{c['id']}", timeout=30)

    def test_create_invoice_and_stock_deduct(self, client, setup):
        p, c = setup["product"], setup["customer"]
        pre_stock = client.get(f"{API}/products", timeout=30).json()
        pre_stock = next(x for x in pre_stock if x["id"] == p["id"])["stock"]

        payload = {
            "customer_id": c["id"],
            "items": [{
                "product_id": p["id"], "name": p["name"], "sku": p["sku"],
                "price": p["price"], "quantity": 3, "unit": "pcs", "hsn": ""
            }],
            "cgst_rate": 9.0, "sgst_rate": 9.0, "discount": 0.0,
            "payment_status": "Paid"
        }
        r = client.post(f"{API}/invoices", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        inv = r.json()
        assert inv["subtotal"] == 300.0
        assert inv["cgst_amount"] == 27.0
        assert inv["sgst_amount"] == 27.0
        assert inv["grand_total"] == 354.0
        assert inv["invoice_no"].startswith("INV-")
        assert "amount_in_words" in inv and inv["amount_in_words"]

        # Verify stock deducted
        prod_after = [x for x in client.get(f"{API}/products", timeout=30).json() if x["id"] == p["id"]][0]
        assert prod_after["stock"] == pre_stock - 3

        # GET invoice
        g = client.get(f"{API}/invoices/{inv['id']}", timeout=30)
        assert g.status_code == 200
        assert g.json()["grand_total"] == 354.0

        # Delete restores stock
        d = client.delete(f"{API}/invoices/{inv['id']}", timeout=30)
        assert d.status_code == 200
        prod_restored = [x for x in client.get(f"{API}/products", timeout=30).json() if x["id"] == p["id"]][0]
        assert prod_restored["stock"] == pre_stock

    def test_insufficient_stock(self, client, setup):
        p, c = setup["product"], setup["customer"]
        payload = {
            "customer_id": c["id"],
            "items": [{
                "product_id": p["id"], "name": p["name"], "sku": p["sku"],
                "price": p["price"], "quantity": 99999, "unit": "pcs", "hsn": ""
            }]
        }
        r = client.post(f"{API}/invoices", json=payload, timeout=30)
        assert r.status_code == 400
        assert "stock" in r.text.lower() or "insufficient" in r.text.lower()
