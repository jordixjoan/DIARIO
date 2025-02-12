require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.json());
app.use(cors());

app.post("/create-checkout-session", async (req, res) => {
    try {
        const { cartItems } = req.body;

        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: "eur",
                product_data: { name: item.name, images: [item.image] },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: "https://github.com/jordixjoan/DIARIO/compra_confirmada.html",
            cancel_url: "https://github.com/jordixjoan/DIARIO/compra_cancelada.html",
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Error en Stripe:", error);
        res.status(500).json({ error: "No se pudo procesar el pago" });
    }
});

app.listen(PORT, () => console.log("Servidor en http://localhost: ${PORT}"));
