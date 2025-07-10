// src/js/worker.js
import { API_BASE_URL, openModal, closeModal, displayMessage } from './main.js';

// Variables globales para los contenedores y modales
let allPetsContainer = null;
let allUsersContainer = null;
let staysContainer = null;
let stayFormModal = null;
let addStayButton = null;
let stayForm = null;
let stayFormTitle = null;
let isStayEditMode = false;

// Variables para el modal de mascotas si el trabajador también lo usa para editar/agregar
let workerPetFormModal = null;
let workerAddPetButton = null;
let workerPetForm = null;
let workerPetFormTitle = null;
let isWorkerPetEditMode = false;

// Función para calcular el valor total de la estancia
const calculateStayTotal = (ingreso, salida, valorDia) => {
    const startDate = new Date(ingreso);
    const endDate = new Date(salida);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) diffDays += 1;
    
    if (isNaN(diffDays) || diffDays <= 0 || isNaN(valorDia) || valorDia < 0) {
        return 0;
    }
    return diffDays * valorDia;
};

// Configuración y listeners para el modal de estancias
export const setupWorkerStayForm = (modalElement, addBtnElement) => {
    stayFormModal = modalElement;
    addStayButton = addBtnElement;
    stayForm = stayFormModal.querySelector('#stay-form');
    stayFormTitle = stayFormModal.querySelector('#stay-form-title');

    const cancelStayFormButton = stayFormModal.querySelector('#cancel-stay-form');
    const stayIngresoInput = stayForm.querySelector('#stay-ingreso');
    const staySalidaInput = stayForm.querySelector('#stay-salida');
    const stayValorDiaInput = stayForm.querySelector('#stay-valor-dia');
    const stayTotalEstimateSpan = stayForm.querySelector('#stay-total-estimate');
    const stayCompletedLabel = stayForm.querySelector('#stay-completed-label');

    // Actualizar el cálculo total de la estancia
    const updateStayTotal = () => {
        const ingreso = stayIngresoInput.value;
        const salida = staySalidaInput.value;
        const valorDia = parseFloat(stayValorDiaInput.value);

        if (ingreso && salida && !isNaN(valorDia) && valorDia > 0 && new Date(ingreso) <= new Date(salida)) {
            const total = calculateStayTotal(ingreso, salida, valorDia);
            stayTotalEstimateSpan.textContent = `$${total.toLocaleString('es-CO')}`;
        } else {
            stayTotalEstimateSpan.textContent = 'Ingrese fechas válidas y valor por día';
        }
    };

    stayIngresoInput.addEventListener('change', updateStayTotal);
    staySalidaInput.addEventListener('change', updateStayTotal);
    stayValorDiaInput.addEventListener('input', updateStayTotal);

    addStayButton.addEventListener('click', () => {
        isStayEditMode = false;
        stayFormTitle.textContent = 'Registrar Nueva Estancia';
        stayForm.reset();
        stayForm.querySelector('#stay-id').value = '';
        stayForm.querySelector('#stay-pet-select').disabled = false;
        stayCompletedLabel.classList.add('hidden');
        populatePetSelect('#stay-pet-select');
        updateStayTotal();
        openModal(stayFormModal);
    });

    cancelStayFormButton.addEventListener('click', () => {
        closeModal(stayFormModal);
        stayForm.reset();
    });

    stayForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const stayId = stayForm.querySelector('#stay-id').value;
        const stayData = {
            petId: parseInt(stayForm.querySelector('#stay-pet-select').value),
            ingreso: stayIngresoInput.value,
            salida: staySalidaInput.value,
            valorDia: parseFloat(stayValorDiaInput.value),
            serviciosAdicionales: stayForm.querySelector('#stay-services').value.split(',').map(s => s.trim()).filter(s => s !== ''),
            completada: stayForm.querySelector('#stay-completed').checked || false
        };

        if (new Date(stayData.ingreso) > new Date(stayData.salida)) {
            alert('La fecha de ingreso no puede ser posterior a la fecha de salida.');
            return;
        }

        try {
            let response;
            if (isStayEditMode) {
                response = await fetch(`${API_BASE_URL}/stays/${stayId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stayData)
                });
                if (response.ok) {
                    alert('Estancia actualizada con éxito!');
                } else {
                    alert('Error al actualizar la estancia.');
                }
            } else {
                response = await fetch(`${API_BASE_URL}/stays`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stayData)
                });
                if (response.ok) {
                    alert('Estancia registrada con éxito!');
                } else {
                    alert('Error al registrar la estancia.');
                }
            }
            closeModal(stayFormModal);
            fetchStays();
        } catch (error) {
            console.error('Error al guardar estancia:', error);
            alert('Hubo un error al guardar la estancia. Revisa la consola.');
        }
    });
};

// Reutilizar lógica de formulario de mascotas para trabajadores (si lo necesitan)
export const setupWorkerPetForm = (modalElement, addBtnElement) => {
    workerPetFormModal = modalElement;
    workerAddPetButton = addBtnElement;
    workerPetForm = workerPetFormModal.querySelector('#pet-form');
    workerPetFormTitle = workerPetFormModal.querySelector('#pet-form-title');

    const cancelPetFormButton = workerPetFormModal.querySelector('#cancel-pet-form');

    if (workerAddPetButton) {
        workerAddPetButton.addEventListener('click', () => {
            isWorkerPetEditMode = false;
            workerPetFormTitle.textContent = 'Agregar Nueva Mascota';
            workerPetForm.reset();
            workerPetForm.querySelector('#pet-id').value = '';
            openModal(workerPetFormModal);
        });
    }

    cancelPetFormButton.addEventListener('click', () => {
        closeModal(workerPetFormModal);
        workerPetForm.reset();
    });

    workerPetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const petId = workerPetForm.querySelector('#pet-id').value;
        const petData = {
            nombre: workerPetForm.querySelector('#pet-name').value,
            peso: parseFloat(workerPetForm.querySelector('#pet-weight').value),
            edad: parseInt(workerPetForm.querySelector('#pet-age').value),
            raza: workerPetForm.querySelector('#pet-breed').value,
            temperamento: workerPetForm.querySelector('#pet-temperament').value,
            anotaciones: workerPetForm.querySelector('#pet-notes').value,
            userId: parseInt(workerPetForm.querySelector('#pet-user-id').value), // Trabajador puede asignar a un usuario
            imageUrl: workerPetForm.querySelector('#pet-image').value
        };

        try {
            let response;
            if (isWorkerPetEditMode) {
                response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(petData)
                });
                if (response.ok) {
                    alert('Mascota actualizada con éxito!');
                } else {
                    alert('Error al actualizar la mascota.');
                }
            } else {
                response = await fetch(`${API_BASE_URL}/pets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(petData)
                });
                if (response.ok) {
                    alert('Mascota registrada con éxito!');
                } else {
                    alert('Error al registrar la mascota.');
                }
            }
            closeModal(workerPetFormModal);
            fetchAllPets();
        } catch (error) {
            console.error('Error al guardar mascota (trabajador):', error);
            alert('Hubo un error al guardar la mascota. Revisa la consola.');
        }
    });
};

// Obtener y mostrar todas las mascotas del sistema (para trabajador)
export const fetchAllPets = async (query = '') => {
    if (!allPetsContainer) return;
    try {
        const url = query ? `${API_BASE_URL}/pets?q=${query}` : `${API_BASE_URL}/pets`;
        const response = await fetch(`${url}&_expand=user`);
        const pets = await response.json();
        allPetsContainer.innerHTML = '';
        if (pets.length === 0) {
            allPetsContainer.innerHTML = '<p>No se encontraron mascotas.</p>';
            return;
        }
        pets.forEach(pet => {
            const petCard = document.createElement('div');
            petCard.className = 'pet-card';
            petCard.innerHTML = `
                <img src="${pet.imageUrl || 'https://via.placeholder.com/150'}" alt="Foto de la mascota" />
                <h3>${pet.nombre} (${pet.raza})</h3>
                <p><strong>Dueño:</strong> ${pet.user ? pet.user.nombre : 'Desconocido'}</p>
                <p><strong>Peso:</strong> ${pet.peso} kg, Edad: ${pet.edad} años</p>
                <p><strong>Temperamento:</strong> ${pet.temperamento}</p>
                <p><strong>Anotaciones:</strong> ${pet.anotaciones || 'N/A'}</p>
                <div class="card-buttons">
                    <button class="edit-pet-worker-btn" data-id="${pet.id}">Editar</button>
                    <button class="delete-pet-worker-btn" data-id="${pet.id}">Eliminar</button>
                </div>
            `;
            allPetsContainer.appendChild(petCard);
        });

        allPetsContainer.querySelectorAll('.edit-pet-worker-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const petId = e.target.dataset.id;
                isWorkerPetEditMode = true;
                workerPetFormTitle.textContent = 'Editar Mascota';
                
                try {
                    const response = await fetch(`${API_BASE_URL}/pets/${petId}`);
                    const petToEdit = await response.json();

                    workerPetForm.querySelector('#pet-id').value = petToEdit.id;
                    workerPetForm.querySelector('#pet-name').value = petToEdit.nombre;
                    workerPetForm.querySelector('#pet-weight').value = petToEdit.peso;
                    workerPetForm.querySelector('#pet-age').value = petToEdit.edad;
                    workerPetForm.querySelector('#pet-breed').value = petToEdit.raza;
                    workerPetForm.querySelector('#pet-temperament').value = petToEdit.temperamento;
                    workerPetForm.querySelector('#pet-notes').value = petToEdit.anotaciones || '';
                    workerPetForm.querySelector('#pet-image').value = petToEdit.imageUrl || '';
                    
                    let userIdInput = workerPetForm.querySelector('#pet-user-id');
                    if (!userIdInput) {
                        userIdInput = document.createElement('input');
                        userIdInput.type = 'number';
                        userIdInput.id = 'pet-user-id';
                        userIdInput.placeholder = 'ID del Dueño';
                        userIdInput.required = true;
                        workerPetForm.insertBefore(userIdInput, workerPetForm.querySelector('#pet-image'));
                    }
                    userIdInput.value = petToEdit.userId;

                    openModal(workerPetFormModal);
                } catch (error) {
                    console.error('Error al cargar mascota para editar (trabajador):', error);
                    alert('No se pudo cargar la información de la mascota.');
                }
            });
        });

        allPetsContainer.querySelectorAll('.delete-pet-worker-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const petId = e.target.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar esta mascota? No se podrá eliminar si tiene estancias registradas.')) {
                    try {
                        const staysResponse = await fetch(`${API_BASE_URL}/stays?petId=${petId}`);
                        const stays = await staysResponse.json();

                        if (stays.length > 0) {
                            alert('No se puede eliminar la mascota porque tiene estancias registradas. Primero elimina sus estancias.');
                            return;
                        }

                        const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            alert('Mascota eliminada con éxito.');
                            fetchAllPets();
                        } else {
                            alert('Error al eliminar la mascota.');
                        }
                    } catch (error) {
                        console.error('Error al eliminar mascota (trabajador):', error);
                        alert('Hubo un error al eliminar la mascota. Revisa la consola.');
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error al cargar todas las mascotas:', error);
        allPetsContainer.innerHTML = '<p>Error al cargar las mascotas.</p>';
    }
};

// Obtener y mostrar todos los usuarios (para trabajador)
export const fetchAllUsers = async (query = '') => {
    if (!allUsersContainer) return;
    try {
        const url = query ? `${API_BASE_URL}/users?q=${query}` : `${API_BASE_URL}/users`;
        const response = await fetch(`${url}&_expand=role`);
        const users = await response.json();
        allUsersContainer.innerHTML = '';
        if (users.length === 0) {
            allUsersContainer.innerHTML = '<p>No se encontraron clientes.</p>';
            return;
        }
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'card';
            userCard.innerHTML = `
                <h4>${user.nombre}</h4>
                <p><strong>Identidad:</strong> ${user.identidad}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Teléfono:</strong> ${user.telefono}</p>
                <p><strong>Rol:</strong> ${user.role ? user.role.name : 'N/A'}</p>
            `;
            allUsersContainer.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error al cargar todos los usuarios:', error);
        allUsersContainer.innerHTML = '<p>Error al cargar los clientes.</p>';
    }
};

// Obtener y mostrar todas las estancias (para trabajador)
export const fetchStays = async () => {
    if (!staysContainer) return;
    try {
        const response = await fetch(`${API_BASE_URL}/stays?_expand=pet`);
        const stays = await response.json();
        staysContainer.innerHTML = '';
        if (stays.length === 0) {
            staysContainer.innerHTML = '<p>No hay estancias registradas.</p>';
            return;
        }
        stays.forEach(stay => {
            const totalValue = calculateStayTotal(stay.ingreso, stay.salida, stay.valorDia);
            const stayCard = document.createElement('div');
            stayCard.className = 'card';
            stayCard.innerHTML = `
                <h4>Estancia de ${stay.pet ? stay.pet.nombre : 'Mascota Desconocida'}</h4>
                <p><strong>Dueño ID:</strong> ${stay.pet ? stay.pet.userId : 'N/A'}</p>
                <p><strong>Ingreso:</strong> ${stay.ingreso}</p>
                <p><strong>Salida:</strong> ${stay.salida}</p>
                <p><strong>Valor por día:</strong> $${stay.valorDia.toLocaleString('es-CO')}</p>
                <p><strong>Servicios Adicionales:</strong> ${stay.serviciosAdicionales && stay.serviciosAdicionales.length > 0 ? stay.serviciosAdicionales.join(', ') : 'Ninguno'}</p>
                <p><strong>Completada:</strong> ${stay.completada ? 'Sí' : 'No'}</p>
                <p><strong>Valor Total:</strong> <strong class="total-value">$${totalValue.toLocaleString('es-CO')}</strong></p>
                <div class="card-buttons">
                    <button class="edit-stay-btn" data-id="${stay.id}">Editar</button>
                </div>
            `;
            staysContainer.appendChild(stayCard);
        });

        staysContainer.querySelectorAll('.edit-stay-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const stayId = e.target.dataset.id;
                isStayEditMode = true;
                stayFormTitle.textContent = 'Editar Estancia';
                stayForm.querySelector('#stay-completed-label').classList.remove('hidden');
                
                try {
                    const response = await fetch(`${API_BASE_URL}/stays/${stayId}?_expand=pet`);
                    const stayToEdit = await response.json();

                    stayForm.querySelector('#stay-id').value = stayToEdit.id;
                    stayForm.querySelector('#stay-ingreso').value = stayToEdit.ingreso;
                    stayForm.querySelector('#stay-salida').value = stayToEdit.salida;
                    stayForm.querySelector('#stay-valor-dia').value = stayToEdit.valorDia;
                    stayForm.querySelector('#stay-services').value = stayToEdit.serviciosAdicionales ? stayToEdit.serviciosAdicionales.join(', ') : '';
                    stayForm.querySelector('#stay-completed').checked = stayToEdit.completada;

                    const petSelect = stayForm.querySelector('#stay-pet-select');
                    petSelect.innerHTML = `<option value="${stayToEdit.pet.id}">${stayToEdit.pet.nombre} (Dueño: ${stayToEdit.pet.userId})</option>`;
                    petSelect.value = stayToEdit.pet.id;
                    petSelect.disabled = true;

                    stayForm.querySelector('#stay-total-estimate').textContent = `$${calculateStayTotal(stayToEdit.ingreso, stayToEdit.salida, stayToEdit.valorDia).toLocaleString('es-CO')}`;

                    openModal(stayFormModal);
                } catch (error) {
                    console.error('Error al cargar estancia para editar:', error);
                    alert('No se pudo cargar la información de la estancia.');
                }
            });
        });

    } catch (error) {
        console.error('Error al cargar las estancias:', error);
        staysContainer.innerHTML = '<p>Error al cargar las estancias.</p>';
    }
};

// Función para rellenar el select de mascotas para las estancias
const populatePetSelect = async (selectElementId) => {
    const selectElement = stayForm.querySelector(selectElementId);
    selectElement.innerHTML = '<option value="">Selecciona una mascota</option>';
    try {
        const petsResponse = await fetch(`${API_BASE_URL}/pets`);
        const pets = await petsResponse.json();
        const usersResponse = await fetch(`${API_BASE_URL}/users`);
        const users = await usersResponse.json();
        
        pets.forEach(pet => {
            const owner = users.find(user => user.id === pet.userId);
            const option = document.createElement('option');
            option.value = pet.id;
            option.textContent = `${pet.nombre} (Dueño: ${owner ? owner.nombre : 'Desconocido'})`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar mascotas para el select de estancias:', error);
    }
};

// Función principal para renderizar el dashboard del trabajador
export const renderWorkerDashboard = (allPetsCont, allUsersCont, staysCont, stayModal, addStayBtn, petModal, addPetBtn) => {
    allPetsContainer = allPetsCont;
    allUsersContainer = allUsersCont;
    staysContainer = staysCont;
    stayFormModal = stayModal;
    addStayButton = addStayBtn;
    workerPetFormModal = petModal;
    workerAddPetButton = addPetBtn;

    setupWorkerStayForm(stayFormModal, addStayButton);
    // setupWorkerPetForm(workerPetFormModal, workerAddPetButton); // Descomenta si el trabajador también gestiona mascotas

    const searchAllPetsInput = document.getElementById('search-all-pets');
    const searchUsersInput = document.getElementById('search-users');

    if (searchAllPetsInput) {
        searchAllPetsInput.addEventListener('input', (e) => fetchAllPets(e.target.value));
    }
    if (searchUsersInput) {
        searchUsersInput.addEventListener('input', (e) => fetchAllUsers(e.target.value));
    }

    fetchAllPets();
    fetchAllUsers();
    fetchStays();
};