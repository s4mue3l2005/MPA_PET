// src/js/landing-page.js
import { checkAuthAndRedirect } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    // Guard: Verificar si hay sesión activa y redirigir al dashboard
    checkAuthAndRedirect('index');

    const goToLoginButton = document.getElementById('go-to-login');
    const goToRegisterButton = document.getElementById('go-to-register');
    const ctaLoginButton = document.getElementById('cta-login');
    const ctaRegisterButton = document.getElementById('cta-register');

    if (goToLoginButton) {
        goToLoginButton.addEventListener('click', () => { window.location.href = './src/views/login.html'; });
    }
    if (goToRegisterButton) {
        goToRegisterButton.addEventListener('click', () => { window.location.href = './src/views/register.html'; });
    }
    if (ctaLoginButton) {
        ctaLoginButton.addEventListener('click', () => { window.location.href = './src/views/login.html'; });
    }
    if (ctaRegisterButton) {
        ctaRegisterButton.addEventListener('click', () => { window.location.href = './src/views/register.html'; });
    }
});