document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll(".add-to-cart");
    const offcanvas = new bootstrap.Offcanvas(document.getElementById("offcanvasCart"));

    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const name = this.getAttribute("data-name");
            const price = parseFloat(this.getAttribute("data-price"));
            let cart = JSON.parse(localStorage.getItem("cart")) || [];

            let existingProduct = cart.find(item => item.name === name);
            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.push({ name, price, quantity: 1 });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            updateCart();
            offcanvas.show();
        });
    });

    function updateCart() {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const cartCount = document.querySelector(".cart-count");
        const cartCountInside = document.getElementById("cart-count");
        const cartItems = document.getElementById("cart-items");
        const cartSubtotal = document.getElementById("cart-subtotal");
        const cartShipping = document.getElementById("cart-shipping");
        const cartTotal = document.getElementById("cart-total");

        cartItems.innerHTML = "";

        if (cart.length === 0) {
            cartItems.innerHTML = "<li class='list-group-item'>Carrito vacío</li>";
            cartCount.textContent = "(0)";
            cartCountInside.textContent = "0";
            cartSubtotal.textContent = "0.00";
            cartShipping.textContent = "0.00";
            cartTotal.textContent = "0.00";
            return;
        }

        let subtotal = 0;
        let totalItems = 0;

        cart.forEach(item => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "lh-sm");

            const decreaseButton = item.quantity > 1 ? `<button class="btn btn-sm btn-outline-secondary change-quantity" data-action="decrease" data-name="${item.name}">-</button>` : '';
            const increaseButton = `<button class="btn btn-sm btn-outline-secondary change-quantity" data-action="increase" data-name="${item.name}">+</button>`;
            const deleteButton = `<button class="btn btn-sm btn-danger delete-item" data-name="${item.name}">Eliminar</button>`;

            li.innerHTML = `
                <div>
                    <h6 class="my-0">${item.name}</h6>
                    <small class="text-body-secondary">Cantidad: 
                        ${decreaseButton}
                        ${item.quantity}
                        ${increaseButton}
                    </small>
                </div>
                <span class="text-body-secondary">${(item.price * item.quantity).toFixed(2)} EUR</span>
                ${deleteButton}
            `;
            cartItems.appendChild(li);

            subtotal += item.price * item.quantity;
            totalItems += item.quantity;
        });

        let shippingCost = 1.99 + (totalItems - 1) * 0.50;
        if (totalItems <= 0) shippingCost = 0;

        cartCount.textContent = `(${totalItems})`;
        cartCountInside.textContent = `${totalItems}`;
        cartSubtotal.textContent = subtotal.toFixed(2);
        cartShipping.textContent = shippingCost.toFixed(2);
        cartTotal.textContent = (subtotal + shippingCost).toFixed(2);
    }

    document.getElementById("checkout-button").addEventListener("click", async function () {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        if (cart.length === 0) {
            alert("El carrito está vacío. Añade productos antes de proceder al pago.");
            return;
        }

        try {
            const response = await fetch("https://diario-production-1.up.railway.app/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cartItems: cart }),
            });

            if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            const data = await response.json();
            if (!data.url) {
                throw new Error("No se recibió una URL de pago.");
            }

            window.location.href = data.url;  // Redirige a Stripe
        } catch (error) {
            alert("Hubo un problema con la compra: " + error.message);
        }
    });

    function changeQuantity(action, name) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        let product = cart.find(item => item.name === name);

        if (product) {
            if (action === "increase") {
                product.quantity += 1;
            } else if (action === "decrease" && product.quantity > 1) {
                product.quantity -= 1;
            }
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCart();
        }
    }

    function deleteItem(name) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart = cart.filter(item => item.name !== name);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCart();
    }

    document.getElementById("cart-items").addEventListener("click", function(event) {
        if (event.target && event.target.classList.contains("change-quantity")) {
            const action = event.target.getAttribute("data-action");
            const name = event.target.getAttribute("data-name");
            changeQuantity(action, name);
        }

        if (event.target && event.target.classList.contains("delete-item")) {
            const name = event.target.getAttribute("data-name");
            deleteItem(name);
        }
    });

    function emptyCart() {
        localStorage.removeItem("cart");
        updateCart();
    }

    updateCart();
});
