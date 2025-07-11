// src/js/main.js
export const API_BASE_URL = 'http://localhost:3000';

export const checkAuthAndRedirect = (currentPage) => {
    const currentUser = localStorage.getItem('currentUser');
    const path = window.location.pathname;

    // Lógica para redirigir si el usuario ya está logueado
    if (currentUser) {
        if (currentPage === 'index' || currentPage === 'login' || currentPage === 'register') {
            window.location.href = './views/dashboard.html';
            return true;
        }
    } else { // Si no hay usuario logueado
        if (currentPage === 'dashboard') {
            window.location.href = '../views/login.html'; // Desde dashboard a login
            return true;
        }
    }

    // Simple guard para 404.html si la URL no coincide con las rutas esperadas
    const validPaths = [
        '/', '/index.html', '/src/views/login.html', '/src/views/register.html', '/src/views/dashboard.html', '/404.html'
    ];
    
    // Normalizar la ruta para incluir el nombre del archivo si es la raíz
    const normalizedPath = path.endsWith('/') ? path + 'index.html' : path;
    const isKnownPath = validPaths.some(p => normalizedPath.endsWith(p));

    if (!isKnownPath && !path.includes('404.html')) {
        // Redirige a 404.html, asegurando la ruta correcta desde cualquier nivel
        const currentDepth = path.split('/').filter(Boolean).length;
        let pathTo404 = '';
        if (currentDepth > 1) { // Si estamos en views/, necesitamos retroceder
            pathTo404 = '../'.repeat(currentDepth -1);
        }
        window.location.href = `${pathTo404}404.html`;
        return true;
    }
    return false;
};

// Funciones auxiliares para mostrar mensajes
export const displayMessage = (element, message, type) => {
    element.textContent = message;
    element.style.display = 'block';
    element.style.color = (type === 'error') ? 'red' : 'green';
    setTimeout(() => { element.style.display = 'none'; }, 5000);
};

// Reutilizar el modal globalmente
export const openModal = (modalElement) => {
    modalElement.classList.remove('hidden');
};

export const closeModal = (modalElement) => {
    modalElement.classList.add('hidden');
};