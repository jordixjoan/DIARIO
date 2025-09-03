// Variables
const carrito = document.querySelector('#carrito');
const listaCursos = document.querySelector('#lista-cursos');
const contenedorCarrito = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.querySelector('#vaciar-carrito');
const procederCompraBtn = document.querySelector('#proceder-compra');
const cantidadCarrito = document.querySelector('#cantidad-carrito'); // Enlace del carrito
const mensajeVacio = document.querySelector('#mensaje-vacio'); // Mensaje cuando el carrito está vacío
let articulosCarrito = [];

// Listeners
cargarEventListeners();


function cargarEventListeners () {
    listaCursos.addEventListener('click', agregarCurso);
    carrito.addEventListener("click", eliminarCurso);
    carrito.addEventListener("click", modificarCantidad); // Evento para botones + y -

    document.addEventListener('DOMContentLoaded', () => {
        articulosCarrito = JSON.parse(localStorage.getItem("carrito")) || [];
        carritoHTML();
    });

    vaciarCarritoBtn.addEventListener("click", () => {
        articulosCarrito = [];
        carritoHTML();
    });

    procederCompraBtn.addEventListener("click", procesarPago);
}

// Funciones

async function procesarPago () {
    if (articulosCarrito.length === 0) {
        alert("El carrito está vacío. Agrega productos antes de proceder al pago.");
        return;
    }

    // Calcular total y gastos de envío
    let totalCantidad = articulosCarrito.reduce((total, item) => total + item.cantidad, 0);
    let gastosEnvio = totalCantidad > 0 ? Math.min(1.50 + (totalCantidad - 1) * 0.50, 2.50) : 0;
    let gastosGestion = 0.49; // Puedes modificar este valor según necesites

    const paisSeleccionado = document.getElementById('pais-select').value;
    console.log(paisSeleccionado);
    // Calcular gastos de envío
    if(paisSeleccionado == 'ES') {
        gastosEnvio = totalCantidad > 0 ? Math.min(1.50 + (totalCantidad - 1) * 0.50, 2.50) : 0;
    }
    else {
        gastosEnvio = totalCantidad > 0 ? Math.min(2.50 + (totalCantidad - 1) * 0.50, 3.50) : 0;
    }
    console.log(gastosEnvio);

    // Comprobar si hay un artículo con título "SE BUSCA"
    const tieneSeBusca = articulosCarrito.some(item => item.id === '101');
    // ➕ Sumar 5 € si hay un "SE BUSCA"
    if (tieneSeBusca) {
        gastosEnvio += 5;
    }

    try {
        const response = await fetch("https://diario-mh0q.onrender.com/create-checkout-session", {
            method: "POST",

            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: [
                    ...articulosCarrito.map(item => ({
                    name: item.titulo,
                    quantity: item.cantidad,
                    price: item.precio,
                })), 
                {
                    name: "Gastos de Envío y Gestión",
                    quantity: 1,
                    price: (gastosEnvio + gastosGestion).toFixed(2),
                } 
                ]
            }),
        });

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url; // Redirige a Stripe
        }
    } catch (error) {
        console.error("Error al procesar el pago:", error);
    }

    articulosCarrito = [];
    carritoHTML();
}

function agregarCurso (e) {
    e.preventDefault();
    if (e.target.classList.contains('agregar-carrito')) {
        const curso = e.target.parentElement.parentElement;
        leerDatosCurso(curso);
        productoAgregado(curso);
    }
}

function productoAgregado (curso) {
    const alert = document.createElement("H4");
    alert.style.cssText = " color: black; text-align: left;";
    alert.style.margin = "-10px 20px";
    alert.textContent = 'Añadido al carrito';
    curso.appendChild(alert);
    setTimeout(() => {
        alert.remove();

    }, 2000);
}

function eliminarCurso (e) {
    if (e.target.classList.contains('borrar-curso')) {
        const cursoId = e.target.getAttribute("data-id");
        articulosCarrito = articulosCarrito.filter(curso => curso.id !== cursoId);
        carritoHTML();
    }
}

function modificarCantidad (e) {
    if (e.target.classList.contains('aumentar-cantidad')) {
        const cursoId = e.target.getAttribute("data-id");
        articulosCarrito = articulosCarrito.map(curso => {
            if (curso.id === cursoId) {
                curso.cantidad++;
            }
            return curso;
        });
    } else if (e.target.classList.contains('disminuir-cantidad')) {
        const cursoId = e.target.getAttribute("data-id");
        articulosCarrito = articulosCarrito.map(curso => {
            if (curso.id === cursoId && curso.cantidad > 1) {
                curso.cantidad--;
            }
            return curso;
        });
    }
    carritoHTML();
}

function leerDatosCurso (curso) {
    const infoCurso = {
        imagen: curso.querySelector('img').src,
        titulo: curso.querySelector('h4').textContent,
        precio: curso.querySelector('.precio span').textContent,
        id: curso.querySelector('a').getAttribute('data-id'),
        cantidad: 1
    };

    const existe = articulosCarrito.some(curso => curso.id === infoCurso.id);
    if (existe) {
        articulosCarrito = articulosCarrito.map(curso => {
            if (curso.id === infoCurso.id) {
                curso.cantidad++;
            }
            return curso;
        });
    } else {
        articulosCarrito = [...articulosCarrito, infoCurso];
    }

    carritoHTML();
}

function carritoHTML () {
    limpiarHTML();

    let total = 0;
    let totalCantidad = 0; // Contador de la cantidad total de artículos

    if (articulosCarrito.length === 0) {
        // Si el carrito está vacío, mostramos el mensaje y ocultamos los botones
        mensajeVacio.style.display = 'block'; // Mostrar mensaje
        document.getElementById("total-carrito").style.display = 'none';
        document.getElementById("gastos-envio").style.display = 'none';
        document.getElementById("seleccion-pais").style.display = 'none';
        document.getElementById("total-real-carrito").style.display = 'none';
        document.getElementById("aviso-correos").style.display = 'none';
        vaciarCarritoBtn.style.display = 'none'; // Ocultar botón "Vaciar carrito"
        procederCompraBtn.style.display = 'none'; // Ocultar botón "Proceder a compra"
        cantidadCarrito.textContent = 0; // Actualizar contador
        return;
    }

    // Si hay productos en el carrito, mostramos los productos
    document.getElementById("total-carrito").style.display = 'block';
    document.getElementById("gastos-envio").style.display = 'block';
    document.getElementById("total-real-carrito").style.display = 'block';
    document.getElementById("seleccion-pais").style.display = 'block';
    document.getElementById("aviso-correos").style.display = 'block';
    mensajeVacio.style.display = 'none'; // Ocultar mensaje
    vaciarCarritoBtn.style.display = 'block'; // Mostrar botón "Vaciar carrito"
    procederCompraBtn.style.display = 'block'; // Mostrar botón "Proceder a compra"

    articulosCarrito.forEach(curso => {
        // Crear la primera fila
        const row1 = document.createElement('tr');
        const precioTotal = parseFloat(curso.precio.replace('€', '').replace(',', '.')) * curso.cantidad;
        total += precioTotal;
        totalCantidad += curso.cantidad;

        // Columna de imagen con rowspan para ocupar dos filas
        const imagenTd = document.createElement('td');
        imagenTd.rowSpan = 2;
        imagenTd.innerHTML = `<img src="${curso.imagen}" width="60">`;

        // Columna de título
        const tituloTd = document.createElement('td');
        tituloTd.textContent = curso.titulo;

        // Columna de precio (cantidad * precio)
        const precioTd = document.createElement('td');
        precioTd.textContent = `${(parseFloat(curso.precio.replace('€', '').replace(',', '.')) * curso.cantidad).toFixed(2)}€`;

        // Se agrega la primera fila con imagen, título y precio
        row1.appendChild(imagenTd);
        row1.appendChild(tituloTd);
        row1.appendChild(precioTd);

        // Crear la segunda fila
        const row2 = document.createElement('tr');

        // Columna de cantidad con botones + y -
        const cantidadTd = document.createElement('td');
        cantidadTd.innerHTML = `<span style='margin-left:15px;'>Cantidad: </span>
        ${curso.cantidad > 1 ? `<button class="disminuir-cantidad" data-id="${curso.id}">−</button>` : ""}
            <span>${curso.cantidad}</span>
            <button class="aumentar-cantidad" data-id="${curso.id}">+</button>
        `;

        // Columna de borrar curso
        const borrarTd = document.createElement('td');
        borrarTd.innerHTML = `<a href="#" class="borrar-curso" data-id="${curso.id}">X</a>`;

        // Se agrega la segunda fila con cantidad y botón de borrar
        row2.appendChild(cantidadTd);
        row2.appendChild(borrarTd);

        // Agregar filas al contenedor del carrito
        contenedorCarrito.appendChild(row1);
        contenedorCarrito.appendChild(row2);
    });


    const paisSeleccionado = document.getElementById('pais-select').value;
    let gastosGestion = 0.49;
    let gastosEnvio;

    // Calcular gastos de envío
    if(paisSeleccionado == 'ES') {
        gastosEnvio = totalCantidad > 0 ? Math.min(1.50 + (totalCantidad - 1) * 0.50, 2.50) : 0;
    }
    else {
        gastosEnvio = totalCantidad > 0 ? Math.min(2.50 + (totalCantidad - 1) * 0.50, 3.50) : 0;
    }

    // Comprobar si hay un artículo con título "SE BUSCA"
    const tieneSeBusca = articulosCarrito.some(item => item.id === '101');
    // ➕ Sumar 5 € si hay un "SE BUSCA"
    if (tieneSeBusca) {
        gastosEnvio += 5;
    }
    

    let gastos = gastosEnvio +  gastosGestion;

    let totalReal = total + gastos;

    // Actualizar el total en el HTML
    document.getElementById("total-precio").textContent = `${total.toFixed(2)}€`;
    document.getElementById("total-envio").textContent = `${gastos.toFixed(2)}€`;
    document.getElementById("total-real").textContent = `${totalReal.toFixed(2)}€`;

    // Actualizar la cantidad en el carrito
    actualizarCantidadCarrito();
    sincronizarStorage();
}

function actualizarCantidadCarrito () {
    const cantidadTotal = articulosCarrito.reduce((total, curso) => total + curso.cantidad, 0);
    cantidadCarrito.textContent = cantidadTotal;
}

function sincronizarStorage () {
    localStorage.setItem("carrito", JSON.stringify(articulosCarrito));
}

function limpiarHTML () {
    while (contenedorCarrito.firstChild) {
        contenedorCarrito.removeChild(contenedorCarrito.firstChild);
    }
}

function guardarCorreo() {
    var email = document.getElementById("email").value;
    var submitBtn = document.getElementById("submitBtn");
    var loader = document.getElementById("loader");
    
    if (email.trim() === "") {
        alert("Por favor, ingresa un correo válido.");
        return;
    }

    // 🔄 Muestra el loader y deshabilita el botón
    loader.style.display = "block";
    submitBtn.style.display = "none";
    submitBtn.disabled = true;

    // Enviar el correo al backend usando fetch
    fetch("https://diario-mh0q.onrender.com/guardar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())  // ✅ Espera la respuesta JSON
    .then(data => {
        if (data.success) {  // ✅ Verifica que el backend respondió con éxito
            window.location.href = "/success/newsletter";  // ✅ Redirige al usuario
        } else {
            alert("Error al guardar el correo.");
            resetBtnNewsletter();
        }
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
        alert("Error al guardar el correo.");
        resetBtnNewsletter();
    });
}

function resetBtnNewsletter() {
    loader.style.display = "none";
    submitBtn.disabled = false;
}