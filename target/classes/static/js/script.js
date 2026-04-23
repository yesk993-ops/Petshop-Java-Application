document.addEventListener('DOMContentLoaded', function() {
    const petsContainer = document.getElementById('petsContainer');
    const loadPetsBtn = document.getElementById('loadPets');
    const addPetBtn = document.getElementById('addPet');
    const addPetModal = document.getElementById('addPetModal');
    const closeModal = document.querySelector('.close');
    const addPetForm = document.getElementById('addPetForm');
    const contactForm = document.getElementById('contactForm');

    // Sample pet images (using Unsplash)
    const petImages = {
        'Dog': 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'Cat': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'Bird': 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'Fish': 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'Rabbit': 'https://images.unsplash.com/photo-1556838803-cc94986cb631?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'default': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    };

    // Fetch pets from backend API
    async function fetchPets() {
        try {
            const response = await fetch('/api/pets');
            if (!response.ok) throw new Error('Failed to fetch pets');
            const pets = await response.json();
            displayPets(pets);
        } catch (error) {
            console.error('Error fetching pets:', error);
            petsContainer.innerHTML = `<p class="error">Could not load pets. Please ensure the backend is running.</p>`;
        }
    }

    // Display pets in the UI
    function displayPets(pets) {
        petsContainer.innerHTML = '';
        if (!pets || Object.keys(pets).length === 0) {
            petsContainer.innerHTML = `<p class="no-pets">No pets available. Add some!</p>`;
            return;
        }

        for (const [id, name] of Object.entries(pets)) {
            const petType = name; // simple mapping
            const imageUrl = petImages[petType] || petImages.default;
            const petCard = document.createElement('div');
            petCard.className = 'pet-card animate__animated animate__fadeInUp';
            petCard.innerHTML = `
                <div class="pet-id">${id}</div>
                <img src="${imageUrl}" alt="${name}" class="pet-image">
                <h3 class="pet-name">${name}</h3>
                <p class="pet-type">${petType}</p>
                <div class="pet-actions">
                    <button class="btn-adopt" onclick="adoptPet(${id})"><i class="fas fa-heart"></i> Adopt</button>
                    <button class="btn-delete" onclick="deletePet(${id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            petsContainer.appendChild(petCard);
        }
    }

    // Adopt a pet (demo)
    window.adoptPet = function(id) {
        alert(`You adopted pet #${id}! Thank you for giving a home!`);
        // In a real app, you would send a request to backend
    };

    // Delete a pet via API
    window.deletePet = async function(id) {
        if (!confirm(`Are you sure you want to delete pet #${id}?`)) return;
        try {
            const response = await fetch(`/api/pets/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Pet deleted successfully!');
                fetchPets(); // refresh list
            } else {
                alert('Failed to delete pet.');
            }
        } catch (error) {
            console.error('Error deleting pet:', error);
            alert('Error deleting pet.');
        }
    };

    // Add a new pet via API
    addPetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('petId').value;
        const name = document.getElementById('petName').value;
        const type = document.getElementById('petType').value;

        const response = await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name: type }) // backend expects id and name
        });

        if (response.ok) {
            alert('Pet added successfully!');
            addPetModal.style.display = 'none';
            fetchPets();
            addPetForm.reset();
        } else {
            alert('Failed to add pet.');
        }
    });

    // Modal controls
    addPetBtn.addEventListener('click', () => {
        addPetModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        addPetModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === addPetModal) {
            addPetModal.style.display = 'none';
        }
    });

    // Contact form submit
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
    });

    // Load pets on button click
    loadPetsBtn.addEventListener('click', fetchPets);

    // Initial load
    fetchPets();

    // Animate pet cards on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.pet-card').forEach(card => observer.observe(card));
});