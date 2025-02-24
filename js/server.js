require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

import cors from 'cors';

const PORT = process.env.PORT || 8080;

// Configurar CORS correctamente
app.use(cors({
    origin: '*', // Permitir todas las solicitudes (prueba con '*' y luego restringe)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para manejar los datos JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'CORS funcionando' });
});

// Ruta para crear la sesión de pago en Stripe
app.post("/create-checkout-session", async (req, res) => {
    console.log("Recibiendo solicitud para crear sesión de pago");
    try {
        const { cartItems } = req.body;  // Extrae los artículos del carrito del cuerpo de la solicitud

        // Verifica si los artículos están presentes
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: "El carrito está vacío o no se ha proporcionado." });
        }

        // Mapea los artículos del carrito para crear los items de Stripe
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: "eur",  // Establece la moneda
                product_data: {
                    name: item.name,  // Nombre del producto
                    images: [item.image],  // Imagen del producto
                },
                unit_amount: Math.round(item.price * 100),  // Convierte el precio a centavos
            },
            quantity: item.quantity,  // Cantidad de cada artículo en el carrito
        }));

        // Crea la sesión de pago en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],  // Acepta pagos con tarjeta
            line_items: lineItems,  // Los artículos a pagar
            mode: "payment",  // Modo de pago: pago directo
            success_url: "",  // URL de éxito
            cancel_url: "",  // URL de cancelación
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
                        display_name: "Envío a España",  // Nombre para la opción de envío
                    },
                },
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: {
                            amount: 299,  // 2,99 EUR
                            currency: "eur",
                        },
                        display_name: "Envío a Europa",  // Nombre para la opción de envío
                    },
                },
            ],
        });

        // Responde con la URL de la sesión para redirigir al usuario al pago
        res.json({ url: session.url });
    } catch (error) {
        console.error("Error en Stripe:", error);
        res.status(500).json({ error: "No se pudo procesar el pago" });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});
