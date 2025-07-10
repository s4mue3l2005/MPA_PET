// src/js/customer.js
import { API_BASE_URL, openModal, closeModal, displayMessage } from './main.js';

let currentUserId = null;
let petListContainer = null;
let petFormModal = null;
let petForm = null;
let addPetBtn = null;
let petFormTitle = null;
let isEditMode = false;

// Función para inicializar el formulario de mascotas para clientes (agregar/editar)
export const setupCustomerPetForm = (userId, modalElement, addBtnElement) => {
    currentUserId = userId;
    petFormModal = modalElement;
    addPetBtn = addBtnElement;
    petForm = petFormModal.querySelector('#pet-form');
    petFormTitle = petFormModal.querySelector('#pet-form-title');

    const cancelPetFormButton = petFormModal.querySelector('#cancel-pet-form');

    // Listener para abrir el modal al hacer clic en "Agregar Mascota"
    addPetBtn.addEventListener('click', () => {
        isEditMode = false;
        petFormTitle.textContent = 'Agregar Nueva Mascota';
        petForm.reset();
        petForm.querySelector('#pet-id').value = ''; // Limpiar el ID si existe
        openModal(petFormModal);
    });

    // Listener para cerrar el modal
    cancelPetFormButton.addEventListener('click', () => {
        closeModal(petFormModal);
        petForm.reset();
    });

    // Manejar el envío del formulario de mascota
    petForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const petId = petForm.querySelector('#pet-id').value;
        const petData = {
            nombre: petForm.querySelector('#pet-name').value,
            peso: parseFloat(petForm.querySelector('#pet-weight').value),
            edad: parseInt(petForm.querySelector('#pet-age').value),
            raza: petForm.querySelector('#pet-breed').value,
            temperamento: petForm.querySelector('#pet-temperament').value,
            anotaciones: petForm.querySelector('#pet-notes').value,
            userId: currentUserId,
            // imageUrl: petForm.querySelector('#pet-image').value
        };

        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(petData)
                });
                if (response.ok) {
                    alert('Mascota actualizada con éxito!');
                } else {
                    alert('Error al actualizar la mascota. Verifica los datos.');
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
                    alert('Error al registrar la mascota. Verifica los datos.');
                }
            }
            closeModal(petFormModal);
            fetchCustomerPets(); // Recargar la lista de mascotas
        } catch (error) {
            console.error('Error al guardar mascota:', error);
            alert('Hubo un error al guardar la mascota. Revisa la consola.');
        }
    });
};

// Función para obtener y mostrar las mascotas del cliente
export const fetchCustomerPets = async () => {
    if (!petListContainer || !currentUserId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/pets?userId=${currentUserId}`);
        const pets = await response.json();
        petListContainer.innerHTML = ''; // Limpiar lista antes de renderizar

        if (pets.length === 0) {
            petListContainer.innerHTML = '<p>No tienes mascotas registradas. ¡Haz clic en "Agregar Mascota" para añadir una!</p>';
            return;
        }

        pets.forEach(pet => {
            const petCard = document.createElement('div');
            petCard.className = 'pet-card';
            petCard.innerHTML = `
                <img src="${pet.imageUrl || 'https://via.placeholder.com/150'}" alt="Foto de la mascota" />
                <h3>${pet.nombre}</h3>
                <p><strong>Raza:</strong> ${pet.raza}</p>
                <p><strong>Peso:</strong> ${pet.peso} kg</p>
                <p><strong>Edad:</strong> ${pet.edad} años</p>
                <p><strong>Temperamento:</strong> ${pet.temperamento}</p>
                <p><strong>Anotaciones:</strong> ${pet.anotaciones || 'N/A'}</p>
                <div class="card-buttons">
                    <button class="edit-btn" data-id="${pet.id}">Editar</button>
                    <button class="delete-btn" data-id="${pet.id}">Eliminar</button>
                </div>
            `;
            petListContainer.appendChild(petCard);
        });

        // Añadir listeners a los botones de editar y eliminar
        petListContainer.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const petId = e.target.dataset.id;
                isEditMode = true;
                petFormTitle.textContent = 'Editar Mascota';
                
                try {
                    const response = await fetch(`${API_BASE_URL}/pets/${petId}`);
                    const petToEdit = await response.json();

                    petForm.querySelector('#pet-id').value = petToEdit.id;
                    petForm.querySelector('#pet-name').value = petToEdit.nombre;
                    petForm.querySelector('#pet-weight').value = petToEdit.peso;
                    petForm.querySelector('#pet-age').value = petToEdit.edad;
                    petForm.querySelector('#pet-breed').value = petToEdit.raza;
                    petForm.querySelector('#pet-temperament').value = petToEdit.temperamento;
                    petForm.querySelector('#pet-notes').value = petToEdit.anotaciones || '';
                    petForm.querySelector('#pet-image').value = petToEdit.imageUrl || '';
                    openModal(petFormModal);
                } catch (error) {
                    console.error('Error al cargar mascota para editar:', error);
                    alert('No se pudo cargar la información de la mascota.');
                }
            });
        });

        petListContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const petId = e.target.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar esta mascota? No se podrá eliminar si tiene estancias registradas.')) {
                    try {
                        const staysResponse = await fetch(`${API_BASE_URL}/stays?petId=${petId}`);
                        const stays = await staysResponse.json();

                        if (stays.length > 0) {
                            alert('No se puede eliminar la mascota porque tiene estancias registradas. Por favor, contacta a un trabajador para gestionar las estancias.');
                            return;
                        }

                        const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            alert('Mascota eliminada con éxito.');
                            fetchCustomerPets(); // Recargar la lista
                        } else {
                            alert('Error al eliminar la mascota.');
                        }
                    } catch (error) {
                        console.error('Error al eliminar mascota:', error);
                        alert('Hubo un error al eliminar la mascota. Revisa la consola.');
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error al cargar las mascotas del cliente:', error);
        petListContainer.innerHTML = '<p>Error al cargar tus mascotas. Por favor, inténtalo de nuevo.</p>';
    }
};

// Función principal para renderizar el dashboard del cliente
export const renderCustomerDashboard = (userId, containerElement, modalElement) => {
    currentUserId = userId;
    petListContainer = containerElement; // Asigna el contenedor de mascotas
    petFormModal = modalElement; // Asigna el modal de mascotas
    fetchCustomerPets(); // Carga las mascotas iniciales
};