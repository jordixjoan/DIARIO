require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 8080;
const app = express();

// Configura CORS para permitir solicitudes de tu frontend
const corsOptions = {
  origin: "*", // Permite todas las URLs, puedes especificar tu dominio si quieres restringirlo
  methods: ["GET", "POST", "OPTIONS"], // Asegúrate de que el método OPTIONS está permitido
  allowedHeaders: ["Content-Type"], // Los encabezados permitidos
};

// Aplica la configuración de CORS
app.use(cors(corsOptions));

// Parsea los datos JSON del cuerpo de las solicitudes
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
    try {
        const { cartItems } = req.body;

        // Mapea los artículos del carrito para crear los items de Stripe
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: "eur",
                product_data: { name: item.name, images: [item.image] },
                unit_amount: Math.round(item.price * 100), // Convertir a centavos
            },
            quantity: 1,
        }));

        // Crea la sesión de pago en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],  // Acepta pagos con tarjetas
            line_items: lineItems,
            mode: "payment",  // Modo de pago: pago directo
            success_url: "https://jordixjoan.github.io/DIARIO/compra_confirmada.html",  // URL de éxito
            cancel_url: "https://jordixjoan.github.io/DIARIO/compra_cancelada.html",  // URL de cancelación
            shipping_address_collection: {
                allowed_countries: ['ES', 'AT', 'BE', 'FR', 'DE', 'IT', 'NL', 'PT', 'SE'],  // Lista de países europeos permitidos
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: {
                            amount: 199,  // 1,99 EUR
                            currency: "eur",
                        },
                        display_name: "Envío a España",
                        // Este costo será para España
                        shipping_rate_name: 'España',
                    },
                },
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: {
                            amount: 299,  // 2,99 EUR
                            currency: "eur",
                        },
                        display_name: "Envío a Europa",
                        // Este costo será para países de Europa
                        shipping_rate_name: 'Europa',
                    },
                },
            ],
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Error en Stripe:", error);
        res.status(500).json({ error: "No se pudo procesar el pago" });
    }
});


// Inicia el servidor en el puerto configurado
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
