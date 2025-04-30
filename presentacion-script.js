// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // Agregar clase 'scrolled' al header cuando se hace scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Filtrar proyectos por categoría
    const categoryButtons = document.querySelectorAll('.project-category-btn');
    const projectCategories = document.querySelectorAll('.project-category');
    
    function filterProjects(category) {
        // Mostrar u ocultar categorías según la selección
        projectCategories.forEach(projectCat => {
            if (category === 'all') {
                projectCat.classList.remove('hidden');
            } else if (!projectCat.classList.contains(category)) {
                projectCat.classList.add('hidden');
            } else {
                projectCat.classList.remove('hidden');
            }
        });
        
        // Actualizar botones activos
        categoryButtons.forEach(button => {
            if (button.dataset.category === category) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            filterProjects(category);
        });
    });

    // Animación para revelar elementos al hacer scroll
    const revealElements = document.querySelectorAll('.tools-grid > div, .features-grid > div, .about-text, .about-badges, .contact-info > div, .about-image, .category-title');
    
    const revealOnScroll = function() {
        for (let i = 0; i < revealElements.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = revealElements[i].getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                revealElements[i].classList.add('active');
            }
        }
    };

    window.addEventListener('scroll', revealOnScroll);
    
    // Ejecutar una vez para elementos que ya estén visibles
    revealOnScroll();

    // Animar barras de habilidades cuando sean visibles
    const skillLevels = document.querySelectorAll('.skill-level');
    
    function animateSkillBars() {
        const skillsSection = document.querySelector('#skills');
        if (!skillsSection) return;
        
        const sectionTop = skillsSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight - 150) {
            skillLevels.forEach(skill => {
                const width = skill.style.width;
                // Aplicar la clase de animación
                skill.classList.add('animate');
            });
            // Eliminar este evento después de animar
            window.removeEventListener('scroll', animateSkillBars);
        }
    }
    
    window.addEventListener('scroll', animateSkillBars);
    
    // Verificar si ya está visible al cargar la página
    setTimeout(animateSkillBars, 500);

    // Suavizar la navegación con desplazamiento
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Añadir efecto hover a las cartas de proyectos
    const projectCards = document.querySelectorAll('.tool-card:not(.coming-soon)');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Añadir contador animado para los números en las insignias
    const badges = document.querySelectorAll('.badge-number');
    let animated = false;
    
    function animateNumbers() {
        if (animated) return;
        
        const aboutSection = document.querySelector('.about');
        const aboutPosition = aboutSection.getBoundingClientRect().top;
        
        if (aboutPosition < window.innerHeight / 1.5) {
            badges.forEach(badge => {
                const target = parseInt(badge.textContent);
                let count = 0;
                const duration = 2000; // ms
                const increment = target / (duration / 16); // 60fps aprox
                
                function updateCount() {
                    if (count < target) {
                        count += increment;
                        badge.textContent = Math.min(Math.ceil(count), target);
                        requestAnimationFrame(updateCount);
                    }
                }
                
                updateCount();
            });
            
            animated = true;
            window.removeEventListener('scroll', animateNumbers);
        }
    }
    
    window.addEventListener('scroll', animateNumbers);
});

// Añadir estilos CSS dinámicos
const styleElement = document.createElement('style');
styleElement.textContent = `
    .tools-grid > div, .features-grid > div, .about-text, .about-badges, 
    .contact-info > div, .about-image, .skill-group, .category-title {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .tools-grid > div.active, .features-grid > div.active, .about-text.active, 
    .about-badges.active, .contact-info > div.active, .about-image.active, 
    .skill-group.active, .category-title.active {
        opacity: 1;
        transform: translateY(0);
    }
    
    .tools-grid > div:nth-child(2) {
        transition-delay: 0.2s;
    }
    
    .tools-grid > div:nth-child(3) {
        transition-delay: 0.4s;
    }
    
    .tools-grid > div:nth-child(4) {
        transition-delay: 0.6s;
    }
    
    .features-grid > div:nth-child(2) {
        transition-delay: 0.2s;
    }
    
    .features-grid > div:nth-child(3) {
        transition-delay: 0.4s;
    }
    
    .contact-info > div:nth-child(2) {
        transition-delay: 0.2s;
    }
    
    header.scrolled {
        background: rgba(10, 15, 25, 0.98);
        padding: 15px 0;
    }
    
    /* Transición para filtrado de categorías */
    .project-category {
        transition: opacity 0.5s ease, height 0.5s ease;
    }
    
    .project-category.hidden {
        opacity: 0;
        height: 0;
        overflow: hidden;
        margin: 0;
        padding: 0;
    }
`;

document.head.appendChild(styleElement);

// Función para controlar el efecto de seguimiento del ratón
document.addEventListener('DOMContentLoaded', function() {
    const heroSection = document.querySelector('.hero');
    const cards = document.querySelectorAll('.card-graphic');
    
    if (!heroSection || cards.length === 0) return;
    
    // Variables para el seguimiento suave del ratón
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetX = mouseX;
    let targetY = mouseY;
    
    // Factor de respuesta al movimiento del ratón (valores más bajos hacen el movimiento más suave)
    const smoothness = 0.05; // Reducido para mayor fluidez
    const maxRotation = 12; // Ángulo máximo de rotación reducido para movimiento más natural
    
    // Actualizar la posición objetivo del ratón
    heroSection.addEventListener('mousemove', function(e) {
        targetX = e.clientX;
        targetY = e.clientY;
    });
    
    // Movimiento suave incluso cuando el ratón sale del área
    heroSection.addEventListener('mouseleave', function() {
        // Volver suavemente a la posición neutral
        targetX = window.innerWidth / 2;
        targetY = window.innerHeight / 2;
    });
    
    // Animación de seguimiento suave
    function animateCards() {
        // Interpolación suave entre la posición actual y la posición objetivo
        mouseX += (targetX - mouseX) * smoothness;
        mouseY += (targetY - mouseY) * smoothness;
        
        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;
            
            // Calcula la distancia relativa del ratón a cada carta
            const deltaX = mouseX - cardCenterX;
            const deltaY = mouseY - cardCenterY;
            
            // Normaliza la rotación basada en la distancia del ratón
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = Math.max(window.innerWidth, window.innerHeight) / 2;
            const normalizedDistance = Math.min(distance / maxDistance, 1);
            
            // Calcula el ángulo de rotación (invertido para que se incline hacia el ratón)
            const rotateX = (deltaY / 40) * maxRotation * (1 - normalizedDistance * 0.5);
            const rotateY = (-deltaX / 40) * maxRotation * (1 - normalizedDistance * 0.5);
            
            // Añade un pequeño desfase entre cartas para un efecto más orgánico
            const cardDelay = index * 0.05;
            const finalRotateX = rotateX * (1 - cardDelay);
            const finalRotateY = rotateY * (1 - cardDelay);
            
            // Efecto de atracción suave hacia el cursor
            const pullFactor = 0.02;
            const pullX = deltaX * pullFactor * (1 - normalizedDistance);
            const pullY = deltaY * pullFactor * (1 - normalizedDistance);
            
            // Aplica la transformación con movimiento 3D mejorado
            card.style.transform = `
                perspective(1000px) 
                rotateX(${finalRotateX}deg) 
                rotateY(${finalRotateY}deg)
                translateX(${pullX}px)
                translateY(${pullY}px)
            `;
            
            // Añade un efecto de elevación y brillo cuando el ratón está cerca
            const hoverIntensity = Math.max(0, 1 - (normalizedDistance * 1.8));
            const liftEffect = hoverIntensity * 20; // Aumentado a 20px para mayor efecto
            
            if (hoverIntensity > 0.1) {
                card.style.transform += ` translateZ(${liftEffect}px)`;
                card.style.boxShadow = `
                    0 ${10 + liftEffect}px ${25 + liftEffect}px rgba(4, 28, 50, 0.5), 
                    0 0 ${15 + liftEffect * 2}px rgba(236, 179, 101, ${0.3 + hoverIntensity * 0.4})
                `;
                
                // Añadir efecto de brillo dinámico
                const glowElement = card.querySelector('i');
                if (glowElement) {
                    glowElement.style.filter = `drop-shadow(0 0 ${5 + hoverIntensity * 6}px rgba(236, 179, 101, ${0.7 + hoverIntensity * 0.3}))`;
                    glowElement.style.transform = `translateZ(${20 + liftEffect * 0.5}px)`;
                }
            } else {
                // Restaurar estado normal
                const glowElement = card.querySelector('i');
                if (glowElement) {
                    glowElement.style.filter = 'drop-shadow(0 0 5px rgba(236, 179, 101, 0.7))';
                    glowElement.style.transform = 'translateZ(20px)';
                }
            }
        });
        
        requestAnimationFrame(animateCards);
    }
    
    // Iniciar la animación
    animateCards();
});