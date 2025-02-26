const cors = require('cors');
const express = require('express');
const app = express();

// Habilita CORS para todas las solicitudes
app.use(cors({
    origin: '*', // O especifica 'https://jordixjoan.github.io'
    methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

app.post('/create-checkout-session', (req, res) => {
    console.log('Recibida petición a /create-checkout-session');
    res.send({ message: 'Checkout iniciado' });
});

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
