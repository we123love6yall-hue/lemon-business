const cart = new Map();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function money(value) {
  return `RM ${Number(value).toFixed(2)}`;
}

function getServiceCard(id) {
  return document.querySelector(`.service-card[data-id="${CSS.escape(id)}"]`);
}

function serviceFromId(id) {
  const card = getServiceCard(id);
  if (!card) return null;
  return {
    id,
    title: card.dataset.title,
    price: Number(card.dataset.price)
  };
}

function cartCount() {
  let total = 0;
  for (const item of cart.values()) total += item.qty;
  return total;
}

function cartTotal() {
  let total = 0;
  for (const item of cart.values()) total += item.qty * item.price;
  return total;
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function renderCart() {
  $("#cartCount").textContent = cartCount();
  $("#cartTotal").textContent = money(cartTotal());

  const wrap = $("#cartItems");
  if (!cart.size) {
    wrap.innerHTML = `<div class="empty-cart">Your bag is empty.<br>Add a service to get started.</div>`;
    $("#checkoutBtn").disabled = true;
    $("#checkoutBtn").style.opacity = ".45";
    $("#checkoutBtn").style.cursor = "not-allowed";
    return;
  }

  $("#checkoutBtn").disabled = false;
  $("#checkoutBtn").style.opacity = "1";
  $("#checkoutBtn").style.cursor = "pointer";

  wrap.innerHTML = [...cart.values()].map(item => `
    <div class="cart-item">
      <div>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${money(item.price)} each</p>
      </div>
      <div class="item-right">
        <strong>${money(item.price * item.qty)}</strong>
        <div class="qty-controls">
          <button type="button" data-dec="${item.id}" aria-label="Decrease">−</button>
          <span>${item.qty}</span>
          <button type="button" data-inc="${item.id}" aria-label="Increase">+</button>
        </div>
      </div>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function addToCart(id) {
  const service = serviceFromId(id);
  if (!service) return;

  if (cart.has(id)) {
    cart.get(id).qty += 1;
  } else {
    cart.set(id, {...service, qty: 1});
  }
  renderCart();
  toast(`${service.title} added`);
  openCart();
}

function adjustQty(id, amount) {
  const item = cart.get(id);
  if (!item) return;
  item.qty += amount;
  if (item.qty <= 0) cart.delete(id);
  renderCart();
}

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  $("#drawerScrim").classList.add("show");
  document.body.classList.add("drawer-open");
}

function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  $("#drawerScrim").classList.remove("show");
  document.body.classList.remove("drawer-open");
}

function openCheckout() {
  if (!cart.size) {
    toast("Add a service first");
    return;
  }
  closeCart();
  $("#checkoutModal").classList.add("open");
  $("#checkoutModal").setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  $("#generatedOrder").hidden = true;
  $("#orderForm").hidden = false;
}

function closeCheckout() {
  $("#checkoutModal").classList.remove("open");
  $("#checkoutModal").setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function buildPlainOrder(data) {
  const lines = [
    `${window.SHOP_CONFIG.shopName} ORDER`,
    `Order: ${data.order_id}`,
    `Roblox: ${data.customer}`,
    "",
    ...data.items.map(item => `${item.qty} × ${item.title} — ${money(item.line_total)}`),
    "",
    `TOTAL: ${money(data.total)}`,
    data.notes ? `Notes: ${data.notes}` : ""
  ];
  return lines.filter(Boolean).join("\n");
}

function showGeneratedOrder(data) {
  $("#orderForm").hidden = true;
  $("#generatedOrder").hidden = false;
  $("#orderId").textContent = data.order_id;

  $("#orderSummary").innerHTML = `
    ${data.items.map(item => `
      <div class="summary-line">
        <span>${item.qty} × ${escapeHtml(item.title)}</span>
        <strong>${money(item.line_total)}</strong>
      </div>
    `).join("")}
    <div class="summary-line" style="border-top:1px solid #e4e7ed;margin-top:6px;padding-top:10px">
      <span>TOTAL</span>
      <strong>${money(data.total)}</strong>
    </div>
  `;

  const hasRealTng = data.payment_link && !String(data.payment_link).includes("YOUR_TNG_PAYMENT_LINK_HERE");
  $("#paymentInfo").textContent = hasRealTng
    ? `Send ${money(data.total)} to ${data.payment_name}. After payment, send order ${data.order_id} to the seller.`
    : `TNG is set to manual mode. Add your real TNG payment link/QR destination in app.py before publishing.`;

  const tngLink = $("#tngLink");
  if (hasRealTng) {
    tngLink.href = data.payment_link;
    tngLink.style.display = "inline-flex";
  } else {
    tngLink.href = "#";
    tngLink.style.display = "none";
  }

  const waBtn = $("#whatsappBtn");
  if (data.whatsapp_number) {
    const message = encodeURIComponent(buildPlainOrder(data));
    waBtn.href = `https://wa.me/${data.whatsapp_number}?text=${message}`;
    waBtn.hidden = false;
  } else {
    waBtn.hidden = true;
  }

  window.__lastOrder = buildPlainOrder(data);
}

async function submitOrder(event) {
  event.preventDefault();
  const customer = $("#customerName").value.trim();
  const notes = $("#orderNotes").value.trim();

  const items = [...cart.values()].map(item => ({
    id: item.id,
    qty: item.qty
  }));

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "CREATING…";

  try {
    const response = await fetch("/api/order", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({customer, notes, items})
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Could not create order.");
    showGeneratedOrder(data);
    toast("Order created");
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = "GENERATE ORDER <span>↗</span>";
  }
}

function copyOrder() {
  if (!window.__lastOrder) return;
  navigator.clipboard.writeText(window.__lastOrder)
    .then(() => toast("Order copied"))
    .catch(() => toast("Copy failed — select the order manually"));
}

function resetOrder() {
  $("#orderForm").reset();
  $("#orderForm").hidden = false;
  $("#generatedOrder").hidden = true;
  window.__lastOrder = "";
}

$$("[data-add]").forEach(btn => {
  btn.addEventListener("click", () => addToCart(btn.dataset.add));
});

$("#cartItems").addEventListener("click", event => {
  const inc = event.target.closest("[data-inc]");
  const dec = event.target.closest("[data-dec]");
  if (inc) adjustQty(inc.dataset.inc, 1);
  if (dec) adjustQty(dec.dataset.dec, -1);
});

$("#openCartBtn").addEventListener("click", openCart);
$("#closeCartBtn").addEventListener("click", closeCart);
$("#drawerScrim").addEventListener("click", closeCart);
$("#checkoutBtn").addEventListener("click", openCheckout);

$("#closeCheckoutBtn").addEventListener("click", closeCheckout);
$("#checkoutModal").addEventListener("click", event => {
  if (event.target.id === "checkoutModal") closeCheckout();
});

$("#orderForm").addEventListener("submit", submitOrder);
$("#copyOrderBtn").addEventListener("click", copyOrder);
$("#newOrderBtn").addEventListener("click", resetOrder);

$$(".filter").forEach(button => {
  button.addEventListener("click", () => {
    $$(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    const selected = button.dataset.filter;
    $$(".service-card").forEach(card => {
      const visible = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("is-hidden", !visible);
    });
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
  }
});

$("#year").textContent = new Date().getFullYear();
renderCart();
