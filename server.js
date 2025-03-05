require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// Configurar CORS correctamente
app.use(cors({
    origin: "https://jordixjoan.github.io/", // Permitir peticiones desde tu frontend
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());

// Endpoint para crear la sesión de pago con Stripe
app.post("/create-checkout-session", async (req, res) => {
    try {
        const { items } = req.body;
        console.log("hola");
        const lineItems = items.map(item => ({
            price_data: {
                currency: "eur",
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [], // Evitar errores si la imagen no existe
                },
                unit_amount: Math.round(parseFloat(item.price.replace('€', '').replace(',', '.')) * 100), // Convertir a céntimos si el precio está en formato string
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la sesión de pago" });
    }
});


// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
