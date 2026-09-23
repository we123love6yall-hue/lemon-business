from flask import Flask, render_template, request, jsonify
from datetime import datetime
import secrets

app = Flask(__name__)

# Shop settings — replace these placeholders with your own details later.
SHOP_NAME = "NOVA CARRY"
TNG_NAME = "YOUR TNG NAME HERE"
TNG_PAYMENT_LINK = "YOUR_TNG_PAYMENT_LINK_HERE"
WHATSAPP_NUMBER = ""  # Example: 60123456789 (digits only). Leave blank to hide the WhatsApp button.

SERVICES = [
    {
        "id": "raid-normal-1",
        "category": "raids",
        "badge": "QUICK",
        "title": "Normal Raid ×1",
        "desc": "Fast carry for standard raids. You host the raid; we carry.",
        "price": 1.00,
        "icon": "⚡",
        "tone": "violet",
    },
    {
        "id": "raid-normal-10",
        "category": "raids",
        "badge": "VALUE",
        "title": "Normal Raid ×10",
        "desc": "Ten standard raid carries in one order.",
        "price": 7.00,
        "icon": "✦",
        "tone": "blue",
    },
    {
        "id": "raid-advanced-5",
        "category": "raids",
        "badge": "POPULAR",
        "title": "Advanced Raid ×5",
        "desc": "Carry for advanced raids with a smooth, coordinated run.",
        "price": 8.00,
        "icon": "☄",
        "tone": "orange",
    },
    {
        "id": "level-700-1000",
        "category": "leveling",
        "badge": "JOKI",
        "title": "Level 700 → 1000",
        "desc": "Grinding service for early-mid progression.",
        "price": 12.00,
        "icon": "↗",
        "tone": "green",
    },
    {
        "id": "level-1000-1500",
        "category": "leveling",
        "badge": "JOKI",
        "title": "Level 1000 → 1500",
        "desc": "Longer grind package for faster progression.",
        "price": 20.00,
        "icon": "⌁",
        "tone": "cyan",
    },
    {
        "id": "sword-tushita",
        "category": "swords",
        "badge": "SWORD",
        "title": "Tushita Unlock",
        "desc": "Assistance with the Tushita unlock path and required steps.",
        "price": 10.00,
        "icon": "⚔",
        "tone": "red",
    },
    {
        "id": "sword-yama",
        "category": "swords",
        "badge": "SWORD",
        "title": "Yama Unlock",
        "desc": "Assistance with Yama-related requirements and runs.",
        "price": 9.00,
        "icon": "◈",
        "tone": "violet",
    },
    {
        "id": "sword-cdk",
        "category": "swords",
        "badge": "SWORD",
        "title": "Cursed Dual Katana",
        "desc": "Guided / carried progression for the CDK requirements.",
        "price": 18.00,
        "icon": "⚔",
        "tone": "dark",
    },
    {
        "id": "gun-soul-guitar",
        "category": "guns",
        "badge": "GUN",
        "title": "Soul Guitar",
        "desc": "Assistance with the Soul Guitar unlock requirements.",
        "price": 18.00,
        "icon": "◉",
        "tone": "pink",
    },
    {
        "id": "v4-any-race",
        "category": "v4",
        "badge": "V4",
        "title": "Race V4 — Any Race",
        "desc": "Carry / assistance for Race V4 progression. Tell us your race in notes.",
        "price": 25.00,
        "icon": "✹",
        "tone": "gold",
    },
    {
        "id": "trade-assist",
        "category": "trade",
        "badge": "TRADE",
        "title": "Trade Assistance",
        "desc": "Help finding a trade setup. No fake items, stolen accounts, or password sharing.",
        "price": 5.00,
        "icon": "⇄",
        "tone": "blue",
    },
    {
        "id": "fruit-trade-session",
        "category": "trade",
        "badge": "TRADE",
        "title": "Fruit Trade Session",
        "desc": "Assisted session for planning and completing a fruit trade.",
        "price": 3.00,
        "icon": "🍋",
        "tone": "lime",
    },
]

SERVICE_BY_ID = {item["id"]: item for item in SERVICES}

@app.get("/")
def home():
    return render_template(
        "index.html",
        shop_name=SHOP_NAME,
        services=SERVICES,
        tng_name=TNG_NAME,
        tng_payment_link=TNG_PAYMENT_LINK,
        whatsapp_number=WHATSAPP_NUMBER,
    )

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/order")
def create_order():
    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    customer = (data.get("customer") or "").strip()[:50]
    notes = (data.get("notes") or "").strip()[:500]

    if not customer:
        return jsonify({"ok": False, "error": "Roblox display name is required."}), 400

    clean_items = []
    total = 0.0

    for raw in items:
        service_id = str(raw.get("id", ""))
        qty = max(1, min(int(raw.get("qty", 1)), 99))
        service = SERVICE_BY_ID.get(service_id)
        if not service:
            continue

        line_total = service["price"] * qty
        total += line_total
        clean_items.append({
            "id": service_id,
            "title": service["title"],
            "qty": qty,
            "price": service["price"],
            "line_total": round(line_total, 2),
        })

    if not clean_items:
        return jsonify({"ok": False, "error": "Your cart is empty."}), 400

    order_id = f"NOVA-{datetime.now().strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"

    return jsonify({
        "ok": True,
        "order_id": order_id,
        "customer": customer,
        "notes": notes,
        "items": clean_items,
        "total": round(total, 2),
        "payment_name": TNG_NAME,
        "payment_link": TNG_PAYMENT_LINK,
        "whatsapp_number": WHATSAPP_NUMBER,
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
