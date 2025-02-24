require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 8080;
const app = express();

const corsOptions = {
    origin: [
      "http://127.0.0.1:5500", // Permitir el localhost en desarrollo
      "https://diario.railway.app", // Asegúrate de que Railway también esté permitido
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  };
  
  app.use(cors(corsOptions));
  

// Parsea los datos JSON del cuerpo de las solicitudes
app.use(express.json());

// Ruta para crear la sesión de pago
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;

        // Valida si los items están presentes en el cuerpo de la solicitud
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).send("Los productos no están definidos.");
        }

        // Crea la sesión de Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price * 100, // Stripe espera los valores en centavos
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${req.headers.origin}/success`,
            cancel_url: `${req.headers.origin}/cancel`,
        });

        // Devuelve la sesión creada
        res.json({ id: session.id });
    } catch (err) {
        console.error('Error creando la sesión de Stripe:', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Inicia el servidor en el puerto configurado
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
