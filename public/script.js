// Theme Toggle Functionality
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;
const themeIcon = themeToggle.querySelector('.theme-icon');

// Check for saved theme preference or default to 'light' mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    html.classList.add('dark');
    themeIcon.classList.remove('bi-moon');
    themeIcon.classList.add('bi-sun');
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');

    // Update icon
    if (html.classList.contains('dark')) {
        themeIcon.classList.remove('bi-moon');
        themeIcon.classList.add('bi-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.classList.remove('bi-sun');
        themeIcon.classList.add('bi-moon');
        localStorage.setItem('theme', 'light');
    }
});

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
});

// Close mobile menu when clicking on a link
const mobileMenuLinks = mobileMenu.querySelectorAll('a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });
});

// Quiz/Calculator Functionality
let quizData = {
    projectType: { value: '', price: 0 },
    pages: { value: '', price: 0 },
    design: { value: '', price: 0 },
    features: []
};

let currentStep = 1;

// Handle single-choice options (steps 1-3)
const quizOptions = document.querySelectorAll('.quiz-option');
quizOptions.forEach(option => {
    option.addEventListener('click', function() {
        const step = parseInt(this.dataset.step);
        const value = this.dataset.value;
        const price = parseInt(this.dataset.price);

        // Remove selected class from all options in current step
        document.querySelectorAll(`[data-step="${step}"]`).forEach(opt => {
            opt.classList.remove('selected');
        });

        // Add selected class to clicked option
        this.classList.add('selected');

        // Store data
        if (step === 1) {
            quizData.projectType = { value, price };
        } else if (step === 2) {
            quizData.pages = { value, price };
        } else if (step === 3) {
            quizData.design = { value, price };
        }

        // Move to next step after a short delay
        setTimeout(() => {
            nextStep();
        }, 300);
    });
});

// Handle multi-choice options (step 4)
const quizOptionsMulti = document.querySelectorAll('.quiz-option-multi');
quizOptionsMulti.forEach(option => {
    const checkbox = option.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function() {
        const value = option.dataset.value;
        const price = parseInt(option.dataset.price);

        // Toggle selected class on div
        option.classList.toggle('selected', this.checked);

        // Update features array
        const existingIndex = quizData.features.findIndex(f => f.value === value);
        if (this.checked && existingIndex === -1) {
            quizData.features.push({ value, price });
        } else if (!this.checked && existingIndex > -1) {
            quizData.features.splice(existingIndex, 1);
        }
    });

    // Allow clicking on div to toggle checkbox
    option.addEventListener('click', function(e) {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
});

function nextStep() {
    // Hide current step
    document.getElementById(`step-${currentStep}`).classList.add('hidden');
    document.getElementById(`step-${currentStep}`).classList.remove('active');

    // Show next step
    currentStep++;
    const nextStepEl = document.getElementById(`step-${currentStep}`);
    if (nextStepEl) {
        nextStepEl.classList.remove('hidden');
        nextStepEl.classList.add('active');

        // Scroll to top of calculator
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
    }
}

function previousStep() {
    // Hide current step
    document.getElementById(`step-${currentStep}`).classList.add('hidden');
    document.getElementById(`step-${currentStep}`).classList.remove('active');

    // Show previous step
    currentStep--;
    const prevStepEl = document.getElementById(`step-${currentStep}`);
    if (prevStepEl) {
        prevStepEl.classList.remove('hidden');
        prevStepEl.classList.add('active');

        // Scroll to top of calculator
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
    }
}

function calculateTotal() {
    // Синхронизировать multi-options с quizData
    document.querySelectorAll('.quiz-option-multi.selected').forEach(opt => {
        const value = opt.dataset.value;
        const price = parseInt(opt.dataset.price);
        if (!quizData.features.find(f => f.value === value)) {
            quizData.features.push({ value, price });
        }
    });

    // Calculate total price
    let total = quizData.projectType.price +
                quizData.pages.price +
                quizData.design.price;

    quizData.features.forEach(feature => {
        total += feature.price;
    });

    // Show result
    document.getElementById(`step-${currentStep}`).classList.add('hidden');
    document.getElementById('step-result').classList.remove('hidden');

    // Display total
    document.getElementById('total-price').textContent = total.toLocaleString('ru-RU') + '₽';

    // Display summary
    const summaryEl = document.getElementById('project-summary');
    summaryEl.innerHTML = '';

    const typeLabels = {
        landing: 'Сайт-визитка / Landing Page',
        corporate: 'Корпоративный сайт',
        shop: 'Интернет-магазин',
        system: 'Информационная система'
    };

    const designLabels = {
        template: 'Готовый шаблон',
        'client-design': 'Готовый дизайн заказчика',
        'custom-design': 'Разработка дизайна с нуля'
    };

    const featureLabels = {
        cms: 'CMS (система управления контентом)',
        forms: 'Формы и интеграции',
        api: 'API интеграции',
        multilang: 'Мультиязычность',
        auth: 'Авторизация и личный кабинет'
    };

    summaryEl.innerHTML += `<div><i class="fas fa-check text-green-500 mr-2"></i><strong>Тип проекта:</strong> ${typeLabels[quizData.projectType.value]}</div>`;
    summaryEl.innerHTML += `<div><i class="fas fa-check text-green-500 mr-2"></i><strong>Количество страниц:</strong> ${quizData.pages.value}</div>`;
    summaryEl.innerHTML += `<div><i class="fas fa-check text-green-500 mr-2"></i><strong>Дизайн:</strong> ${designLabels[quizData.design.value]}</div>`;

    if (quizData.features.length > 0) {
        summaryEl.innerHTML += `<div class="mt-4"><strong>Дополнительные функции:</strong></div>`;
        quizData.features.forEach(feature => {
            summaryEl.innerHTML += `<div class="ml-4"><i class="fas fa-check text-green-500 mr-2"></i>${featureLabels[feature.value]}</div>`;
        });
    }

    // Scroll to result
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
}

function resetQuiz() {
    // Reset data
    quizData = {
        projectType: { value: '', price: 0 },
        pages: { value: '', price: 0 },
        design: { value: '', price: 0 },
        features: []
    };

    currentStep = 1;

    // Remove all selected classes and uncheck checkboxes
    document.querySelectorAll('.quiz-option, .quiz-option-multi').forEach(opt => {
        opt.classList.remove('selected');
        const checkbox = opt.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;
    });

    // Hide result and show first step
    document.getElementById('step-result').classList.add('hidden');
    document.getElementById('step-1').classList.remove('hidden');
    document.getElementById('step-1').classList.add('active');

    // Hide other steps
    for (let i = 2; i <= 4; i++) {
        document.getElementById(`step-${i}`).classList.add('hidden');
        document.getElementById(`step-${i}`).classList.remove('active');
    }

    // Scroll to calculator
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
}

// Portfolio Modal Functionality
const portfolioItems = document.querySelectorAll('.portfolio-item');
const modal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');

portfolioItems.forEach(item => {
    item.addEventListener('click', function() {
        const imageUrl = this.dataset.image;
        modalImage.src = imageUrl;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
});

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside the image
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// Contact Form Handling
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Получаем данные формы
    const formData = {
        name: contactForm.querySelector('input[type="text"]').value,
        email: contactForm.querySelector('input[type="email"]').value,
        phone: contactForm.querySelector('input[type="tel"]').value,
        message: contactForm.querySelector('textarea').value
    };

    // Блокируем кнопку во время отправки
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Отправка...';

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ ' + result.message);
            contactForm.reset();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('❌ Ошибка при отправке заявки. Проверьте подключение к интернету.');
    } finally {
        // Восстанавливаем кнопку
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.card, section > div > div').forEach(el => {
    observer.observe(el);
});

// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scroll-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.classList.remove('opacity-0');
        scrollToTopBtn.classList.add('opacity-100');
    } else {
        scrollToTopBtn.classList.remove('opacity-100');
        scrollToTopBtn.classList.add('opacity-0');
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 6px -1px var(--shadow)';
    } else {
        navbar.style.boxShadow = '0 1px 3px 0 var(--shadow)';
    }

    lastScroll = currentScroll;
});
