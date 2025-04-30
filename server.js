require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");  // Asegúrate de agregar esta línea
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

app.use((req, res, next) => {
    console.log("📥 Request:", req.method, req.originalUrl);
    next();
  });

// Ruta para manejar los eventos de Stripe
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    console.log("🔍 Tipo de body:", typeof req.body); 
    console.log("🔍 Es buffer:", Buffer.isBuffer(req.body)); // DEBE SER TRUE

    console.log("🔔 Webhook recibido");
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento de sesión completada
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        
        // Recuperar la sesión con productos expandidos
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["line_items.data.price.product"],
        });

        const lineItems = sessionWithLineItems.line_items.data.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price.unit_amount,
            currency: item.currency,
            description: item.description || item.price.product?.name, // Usar 'name' si no hay 'description'
        }));

        const customerDetails = session.customer_details;
        console.log("Datos del cliente:", customerDetails);
        console.log("Productos comprados:", lineItems);
        // Aquí puedes guardar los datos en tu base de datos o enviarlos donde los necesites

        const appsScriptUrl = "https://script.google.com/macros/s/AKfycbx8E2S-XxhTfOd2vpck-RWDBlYfjphCSHaErbKVztgwKCLsZ6zl-elfkKLcQToATFY/exec";

        try {
            await fetch(appsScriptUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "checkout.session.completed",
                data: {
                object: {
                    id: session.id,
                    customer_details: customerDetails,
                },
                line_items: lineItems,
                },
            }),
        });
        console.log("✅ Datos enviados correctamente a Apps Script");
        } catch (error) {
        console.error("❌ Error enviando datos a Apps Script:", error.message);
        }
    }

    res.status(200).json({ received: true });
});

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
            success_url: `${process.env.FRONTEND_URL}/success/pago`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            
            // Solicitar información del cliente
            billing_address_collection: "required", // Pide la dirección de facturación
            shipping_address_collection: {
                allowed_countries: [
                    "ES", // España
                    "DE", // Alemania
                    "FR", // Francia
                    "GB", // Reino Unido
                    "IT", // Italia
                    "NL", // Países Bajos
                    "SE", // Suecia
                    "CH", // Suiza
                    "BE", // Bélgica
                    "PL", // Polonia
                    "AT", // Austria
                    "IE", // Irlanda
                    "DK", // Dinamarca
                    "FI", // Finlandia
                    "PT"  // Portugal
                ]
            },                    
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
        const response = await fetch("https://script.google.com/macros/s/AKfycbyIL-3FZcyt1Y6V-9cZ-KheBV9BCGFY5ZnWi5Mq66-GBPogu3TjWmny2SP9QjqnbrtD/exec", {
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
