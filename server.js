require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// Configurar CORS correctamente
const allowedOrigins = [
    "https://jordixjoan.com",  // Tu frontend en GitHub Pages
    "https://diario-production-1.up.railway.app",
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

app.get('/', (req, res) => {
    res.redirect('https://www.jordixjoan.com');
});

// Endpoint para crear la sesión de pago con Stripe
app.post("/create-checkout-session", async (req, res) => {
    try {
        const { items } = req.body;
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            
            // Solicitar información del cliente
            billing_address_collection: "required", // Pide la dirección de facturación
            shipping_address_collection: {
                allowed_countries: [
                    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "CH", "CY", "CZ", "DE", "DK", 
                    "EE", "ES", "FI", "FO", "FR", "GB", "GE", "GG", "GI", "GR", "HR", "HU", 
                    "IE", "IM", "IS", "IT", "JE", "KV", "LI", "LT", "LU", "LV", "MC", "MD", 
                    "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", 
                    "SJ", "SK", "SM", "UA", "VA", "XK"
                ]
            }         
            phone_number_collection: {
                enabled: true, // Solicita el número de teléfono
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la sesión de pago" });
    }
});

// Ruta para guardar el correo
app.post("/guardar-correo", async (req, res) => {
    const email = req.body.email;
    console.log("guarda correo");
    // Verificar si se ha recibido un correo
    if (!email) {
        return res.status(400).json({ error: "Correo electrónico es requerido" });
    }

    try {
        // Llama a tu Google Apps Script (la URL del servicio web)
        const response = await fetch("https://script.google.com/macros/s/AKfycbwxl9KLeNsUpidoDtuAZhsFJJb-Oy_e0-MHhovqK0pbebm2JAxbLSGWGHOtWYRpliE2/exec", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });

        if (response.ok) {
            res.json({ success: true });  // Responde con éxito al frontend
        } else {
            const responseText = await response.text();
            console.log("Error al guardar correo:", responseText);
            res.status(500).json({ error: "Error al guardar el correo" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al conectar con el servidor de Google Sheets" });
    }
});


// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
