# NOVA CARRY — Flask Storefront

A polished, fan-made Blox Fruits service storefront built with Flask, HTML, CSS and vanilla JavaScript.

## Included
- Responsive landing page inspired by the provided clean/minimal header reference
- Service catalog for raids, leveling/joki, swords, guns, Race V4 and trade assistance
- Category filters
- Working cart
- Checkout modal
- Order reference generation
- Manual TNG payment placeholder
- Optional WhatsApp order button
- No Roblox password field

## Run locally (Windows)

```bat
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open: http://127.0.0.1:5000

## Before publishing

Open `app.py` and replace:

```python
TNG_NAME = "YOUR TNG NAME HERE"
TNG_PAYMENT_LINK = "YOUR_TNG_PAYMENT_LINK_HERE"
WHATSAPP_NUMBER = ""
```

Do not paste passwords, verification codes, API secrets, or private credentials into the frontend.

## Render

Build command:
```text
pip install -r requirements.txt
```

Start command:
```text
gunicorn app:app
```

## Notes

The service prices in this demo are editable example prices, not official Roblox or Blox Fruits pricing.
