// src/js/auth.js
import { API_BASE_URL, displayMessage, checkAuthAndRedirect } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Guard para login y register: Si ya hay sesión, redirigir al dashboard
    if (loginForm) {
        checkAuthAndRedirect('login');
    }
    if (registerForm) {
        checkAuthAndRedirect('register');
    }

    if (loginForm) {
        const errorMessage = document.getElementById('error-message');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailOrIdentity = loginForm['login-username'].value;
            const password = loginForm['login-password'].value;

            try {
                const response = await fetch(`${API_BASE_URL}/users?q=${emailOrIdentity}`);
                const users = await response.json();

                let user = users.find(u => (u.email === emailOrIdentity || u.identidad === emailOrIdentity) && u.contrasena === password);

                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = './dashboard.html';
                } else {
                    displayMessage(errorMessage, 'Credenciales incorrectas. Por favor, verifica tu email/identidad y contraseña.', 'error');
                }
            } catch (error) {
                console.error('Error durante el inicio de sesión:', error);
                displayMessage(errorMessage, 'Hubo un error al iniciar sesión. Inténtalo de nuevo más tarde.', 'error');
            }
        });

        // Manejar click en "Regístrate aquí"
        document.getElementById('login-go-register').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = './register.html';
        });
    }

    if (registerForm) {
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUser = {
                nombre: registerForm['register-name'].value,
                identidad: registerForm['register-identity'].value,
                telefono: registerForm['register-phone'].value,
                direccion: registerForm['register-address'].value,
                email: registerForm['register-email'].value,
                contrasena: registerForm['register-password'].value,
                rolId: 2 // Por defecto, cliente
            };

            try {
                const existingEmailResponse = await fetch(`${API_BASE_URL}/users?email=${newUser.email}`);
                const existingEmailUsers = await existingEmailResponse.json();
                if (existingEmailUsers.length > 0) {
                    displayMessage(errorMessage, 'El email ya está registrado.', 'error');
                    return;
                }

                const existingIdentityResponse = await fetch(`${API_BASE_URL}/users?identidad=${newUser.identidad}`);
                const existingIdentityUsers = await existingIdentityResponse.json();
                if (existingIdentityUsers.length > 0) {
                    displayMessage(errorMessage, 'La identidad ya está registrada.', 'error');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });

                if (response.ok) {
                    displayMessage(successMessage, '¡Registro exitoso! Ahora puedes iniciar sesión.', 'success');
                    registerForm.reset();
                } else {
                    displayMessage(errorMessage, 'Error al registrar usuario. Inténtalo de nuevo.', 'error');
                }
            } catch (error) {
                console.error('Error durante el registro:', error);
                displayMessage(errorMessage, 'Hubo un error al registrarte. Inténtalo de nuevo más tarde.', 'error');
            }
        });

        // Manejar click en "Inicia sesión"
        document.getElementById('register-go-login').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = './login.html';
        });
    }
});