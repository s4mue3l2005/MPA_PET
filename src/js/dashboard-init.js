// src/js/dashboard-init.js
import { checkAuthAndRedirect, API_BASE_URL } from './main.js';
import { renderCustomerDashboard, setupCustomerPetForm } from './customer.js';
import { renderWorkerDashboard, setupWorkerStayForm } from './worker.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Guard para el dashboard: Si no hay usuario logueado, redirige al login
    checkAuthAndRedirect('dashboard');

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const dashboardTitle = document.getElementById('dashboard-title');
    const logoutButton = document.getElementById('logout-btn');
    const customerDashboardContent = document.getElementById('customer-dashboard-content');
    const workerDashboardContent = document.getElementById('worker-dashboard-content');
    const addPetButton = document.getElementById('add-pet-btn');
    const addStayButton = document.getElementById('add-stay-btn');
    const petFormModal = document.getElementById('pet-form-modal');
    const stayFormModal = document.getElementById('stay-form-modal');

    // Funcionalidad de cerrar sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html'; // Redirigir a la landing page
        });
    }

    // Determinar qué dashboard cargar según el rol del usuario
    if (currentUser && currentUser.rolId) {
        try {
            const response = await fetch(`${API_BASE_URL}/roles/${currentUser.rolId}`);
            if (!response.ok) throw new Error('Rol no encontrado');
            const role = await response.json();

            dashboardTitle.textContent = `Bienvenido ${currentUser.nombre} (${role.name})`;

            if (role.name === 'customer') {
                if (workerDashboardContent) workerDashboardContent.classList.add('hidden');
                if (addPetButton) addPetButton.classList.remove('hidden');
                
                const petsContainer = document.getElementById('pets-container');
                if (petsContainer && petFormModal && addPetButton) {
                    renderCustomerDashboard(currentUser.id, petsContainer, petFormModal);
                    setupCustomerPetForm(currentUser.id, petFormModal, addPetButton);
                }
            } else if (role.name === 'worker') {
                if (customerDashboardContent) customerDashboardContent.classList.add('hidden');
                if (addStayButton) addStayButton.classList.remove('hidden');

                const allPetsContainer = document.getElementById('all-pets-container');
                const allUsersContainer = document.getElementById('all-users-container');
                const staysContainer = document.getElementById('stays-container');
                
                if (allPetsContainer && allUsersContainer && staysContainer && stayFormModal && addStayButton && petFormModal && addPetButton) {
                     renderWorkerDashboard(allPetsContainer, allUsersContainer, staysContainer, stayFormModal, addStayButton, petFormModal, addPetButton);
                }
            } else {
                console.error('Rol desconocido:', role.name);
                window.location.href = '../404.html';
            }
        } catch (error) {
            console.error('Error al cargar el rol del usuario:', error);
            window.location.href = '../404.html';
        }
    } else {
        // Esto ya debería ser manejado por checkAuthAndRedirect, pero es una buena medida de seguridad.
        console.error('No hay usuario actual o rol definido.');
        window.location.href = '../views/login.html';
    }
});