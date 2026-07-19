from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------- Models ---------------- #

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sku: str
    price: float
    stock: int
    unit: str = "pcs"
    low_stock_threshold: int = 5
    hsn: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)


class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    stock: int = 0
    unit: str = "pcs"
    low_stock_threshold: int = 5
    hsn: Optional[str] = ""


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    unit: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    hsn: Optional[str] = None


class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    gstin: Optional[str] = ""
    address: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    gstin: Optional[str] = ""
    address: Optional[str] = ""


class InvoiceItem(BaseModel):
    product_id: str
    name: str
    sku: str
    hsn: Optional[str] = ""
    price: float
    quantity: int
    unit: str = "pcs"


class InvoiceCreate(BaseModel):
    customer_id: str
    items: List[InvoiceItem]
    cgst_rate: float = 9.0
    sgst_rate: float = 9.0
    discount: float = 0.0
    payment_status: str = "Pending"  # Paid | Pending | Partial
    notes: Optional[str] = ""


class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_no: str
    customer_id: str
    customer_snapshot: dict
    items: List[InvoiceItem]
    subtotal: float
    cgst_rate: float
    sgst_rate: float
    cgst_amount: float
    sgst_amount: float
    discount: float
    grand_total: float
    amount_in_words: str
    payment_status: str
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)


# ---------------- Helpers ---------------- #

INDIAN_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
               "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
               "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
INDIAN_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


def _two_digit(n: int) -> str:
    if n < 20:
        return INDIAN_ONES[n]
    return (INDIAN_TENS[n // 10] + (" " + INDIAN_ONES[n % 10] if n % 10 else "")).strip()


def _three_digit(n: int) -> str:
    result = ""
    if n >= 100:
        result += INDIAN_ONES[n // 100] + " Hundred"
        n = n % 100
        if n:
            result += " "
    if n:
        result += _two_digit(n)
    return result


def number_to_indian_words(amount: float) -> str:
    rupees = int(amount)
    paise = round((amount - rupees) * 100)
    if rupees == 0:
        words = "Zero"
    else:
        crore = rupees // 10000000
        rupees %= 10000000
        lakh = rupees // 100000
        rupees %= 100000
        thousand = rupees // 1000
        rupees %= 1000
        parts = []
        if crore:
            parts.append(_two_digit(crore) + " Crore")
        if lakh:
            parts.append(_two_digit(lakh) + " Lakh")
        if thousand:
            parts.append(_two_digit(thousand) + " Thousand")
        if rupees:
            parts.append(_three_digit(rupees))
        words = " ".join(parts).strip()
    result = f"Rupees {words}"
    if paise:
        result += f" and {_two_digit(paise)} Paise"
    return result + " Only"


async def _next_invoice_no() -> str:
    year = datetime.now(timezone.utc).strftime("%y")
    count = await db.invoices.count_documents({}) + 1
    return f"INV-{year}-{count:05d}"


# ---------------- Routes: Products ---------------- #

@api_router.get("/")
async def root():
    return {"message": "Billing & Inventory API"}


@api_router.get("/products", response_model=List[Product])
async def list_products():
    docs = await db.products.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [Product(**d) for d in docs]


@api_router.post("/products", response_model=Product)
async def create_product(payload: ProductCreate):
    exists = await db.products.find_one({"sku": payload.sku}, {"_id": 0})
    if exists:
        raise HTTPException(status_code=400, detail="SKU already exists")
    product = Product(**payload.model_dump())
    await db.products.insert_one(product.model_dump())
    return product


@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    result = await db.products.update_one({"id": product_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return Product(**doc)


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ---------------- Routes: Customers ---------------- #

@api_router.get("/customers", response_model=List[Customer])
async def list_customers():
    docs = await db.customers.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [Customer(**d) for d in docs]


@api_router.post("/customers", response_model=Customer)
async def create_customer(payload: CustomerCreate):
    customer = Customer(**payload.model_dump())
    await db.customers.insert_one(customer.model_dump())
    return customer


@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"ok": True}


# ---------------- Routes: Invoices ---------------- #

@api_router.get("/invoices", response_model=List[Invoice])
async def list_invoices():
    docs = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Invoice(**d) for d in docs]


@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    doc = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return Invoice(**doc)


@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(payload: InvoiceCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Invoice must have at least one item")

    # Validate customer
    customer = await db.customers.find_one({"id": payload.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Validate stock and gather product docs
    products_map = {}
    for item in payload.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.name}")
        if product["stock"] < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product['name']}. Available: {product['stock']}, Requested: {item.quantity}",
            )
        products_map[item.product_id] = product

    # Calculate totals
    subtotal = round(sum(i.price * i.quantity for i in payload.items), 2)
    taxable = max(subtotal - payload.discount, 0)
    cgst_amount = round(taxable * payload.cgst_rate / 100, 2)
    sgst_amount = round(taxable * payload.sgst_rate / 100, 2)
    grand_total = round(taxable + cgst_amount + sgst_amount, 2)

    invoice_no = await _next_invoice_no()

    invoice = Invoice(
        invoice_no=invoice_no,
        customer_id=payload.customer_id,
        customer_snapshot={
            "name": customer["name"],
            "phone": customer.get("phone", ""),
            "email": customer.get("email", ""),
            "gstin": customer.get("gstin", ""),
            "address": customer.get("address", ""),
        },
        items=payload.items,
        subtotal=subtotal,
        cgst_rate=payload.cgst_rate,
        sgst_rate=payload.sgst_rate,
        cgst_amount=cgst_amount,
        sgst_amount=sgst_amount,
        discount=payload.discount,
        grand_total=grand_total,
        amount_in_words=number_to_indian_words(grand_total),
        payment_status=payload.payment_status,
        notes=payload.notes or "",
    )

    # Persist invoice
    doc = invoice.model_dump()
    doc["items"] = [i.model_dump() for i in invoice.items]
    await db.invoices.insert_one(doc)

    # Deduct stock atomically per item
    for item in payload.items:
        await db.products.update_one(
            {"id": item.product_id},
            {"$inc": {"stock": -item.quantity}},
        )

    return invoice


@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    doc = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    # Restore stock
    for item in doc.get("items", []):
        await db.products.update_one(
            {"id": item["product_id"]},
            {"$inc": {"stock": item["quantity"]}},
        )
    await db.invoices.delete_one({"id": invoice_id})
    return {"ok": True}


# ---------------- Routes: Dashboard ---------------- #

@api_router.get("/dashboard/stats")
async def dashboard_stats():
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(5000)
    products = await db.products.find({}, {"_id": 0}).to_list(5000)
    customers_count = await db.customers.count_documents({})

    total_sales = round(sum(i.get("grand_total", 0) for i in invoices), 2)
    pending_amount = round(
        sum(i.get("grand_total", 0) for i in invoices if i.get("payment_status") != "Paid"), 2
    )
    low_stock = [p for p in products if p.get("stock", 0) <= p.get("low_stock_threshold", 5)]
    inventory_value = round(sum(p.get("stock", 0) * p.get("price", 0) for p in products), 2)

    return {
        "total_invoices": len(invoices),
        "total_sales": total_sales,
        "pending_amount": pending_amount,
        "low_stock_count": len(low_stock),
        "inventory_value": inventory_value,
        "customers_count": customers_count,
        "low_stock_items": [
            {"id": p["id"], "name": p["name"], "sku": p["sku"], "stock": p["stock"]}
            for p in low_stock[:10]
        ],
        "recent_invoices": sorted(invoices, key=lambda x: x.get("created_at", ""), reverse=True)[:5],
    }


# ---------------- Seed sample data ---------------- #

@api_router.post("/seed")
async def seed_data():
    """Idempotent seed for demo purposes."""
    existing_products = await db.products.count_documents({})
    if existing_products == 0:
        sample_products = [
            {"name": "Basmati Rice 5kg", "sku": "RICE-5K", "price": 550.0, "stock": 40, "unit": "bag", "low_stock_threshold": 10, "hsn": "1006"},
            {"name": "Sunflower Oil 1L", "sku": "OIL-SUN-1L", "price": 165.0, "stock": 80, "unit": "btl", "low_stock_threshold": 15, "hsn": "1512"},
            {"name": "Turmeric Powder 500g", "sku": "SPC-TUR-500", "price": 120.0, "stock": 6, "unit": "pkt", "low_stock_threshold": 10, "hsn": "0910"},
            {"name": "Wheat Flour 10kg", "sku": "FLOUR-10K", "price": 480.0, "stock": 25, "unit": "bag", "low_stock_threshold": 8, "hsn": "1101"},
            {"name": "Sugar 1kg", "sku": "SUGAR-1K", "price": 48.0, "stock": 3, "unit": "pkt", "low_stock_threshold": 20, "hsn": "1701"},
            {"name": "Tea Powder 250g", "sku": "TEA-250", "price": 145.0, "stock": 55, "unit": "pkt", "low_stock_threshold": 15, "hsn": "0902"},
        ]
        for p in sample_products:
            prod = Product(**p)
            await db.products.insert_one(prod.model_dump())

    existing_customers = await db.customers.count_documents({})
    if existing_customers == 0:
        sample_customers = [
            {"name": "Ravi Traders", "phone": "9876543210", "email": "ravi@example.com", "gstin": "33AABCR1234M1Z5", "address": "12, Anna Nagar, Chennai, TN"},
            {"name": "Sri Balaji Stores", "phone": "9012345678", "email": "balaji@example.com", "gstin": "33AAECS9876P1Z2", "address": "45, Gandhi Road, Coimbatore, TN"},
            {"name": "Walk-in Customer", "phone": "", "email": "", "gstin": "", "address": ""},
        ]
        for c in sample_customers:
            cus = Customer(**c)
            await db.customers.insert_one(cus.model_dump())

    return {"ok": True, "seeded": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_seed():
    try:
        if await db.products.count_documents({}) == 0:
            await seed_data()
    except Exception as e:
        logger.warning(f"Seed skipped: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
