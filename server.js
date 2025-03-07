require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// Configurar CORS correctamente
const allowedOrigins = [
    "https://jordixjoan.com",  // Tu frontend en GitHub Pages
    "http://127.0.0.1:5000",         // Backend local
    "http://127.0.0.1:5500"          // Si usas Live Server u otro puerto
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());

// Endpoint para crear la sesión de pago con Stripe
app.post("/create-checkout-session", async (req, res) => {
    try {
        const { items shipping } = req.body;
        console.log(items);
        const lineItems = items.map(item => ({
            price_data: {
                currency: "eur",
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(parseFloat(item.price.replace('€', '').replace(',', '.')) * 100), // Convertir a céntimos si el precio está en formato string
            },
            quantity: item.quantity,
        }));

        // Agregar gastos de envío como un "servicio" sin cantidad visible
        if (shipping && (shipping.price > 0)) {
            lineItems.push({
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: shipping.name,
                        description: "Incluye los costes de envío y la gestión del pedido.",
                    },
                    unit_amount: shipping.price,
                },
                quantity: 1, // Esto es necesario, pero Stripe lo mostrará como un solo cargo
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/success.html`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
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
