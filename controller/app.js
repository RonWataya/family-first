document.addEventListener('DOMContentLoaded', () => {
    // Cache all necessary DOM elements for efficiency
    const DOMElements = {
        registerBtns: document.querySelectorAll('#registerBtn, #heroRegisterBtn'),
        registrationFormSection: document.getElementById('registrationForm'),
        multiStepForm: document.getElementById('multiStepForm'),
        nextStepBtn: document.getElementById('nextStepBtn'),
        prevStepBtn: document.getElementById('prevStepBtn'),
        formSteps: document.querySelectorAll('.form-step'),
        stepIndicators: document.querySelectorAll('.step-item'),
        messageBox: document.getElementById('messageBox'),
        messageTitle: document.getElementById('messageTitle'),
        messageText: document.getElementById('messageText'),
        closeMessageBtn: document.getElementById('closeMessageBtn'),
        messageBoxBackdrop: document.getElementById('messageBoxBackdrop')
    };

    let currentStep = 0;

    // --- Utility Functions ---

    /**
     * Shows a custom message box with a title and message.
     * @param {string} title The title of the message.
     * @param {string} message The body text of the message.
     */
   function showMessageBox(title, message) {
    DOMElements.messageTitle.textContent = title;
    DOMElements.messageText.textContent = message;
    DOMElements.messageBox.classList.remove('d-none');
    DOMElements.messageBoxBackdrop.classList.remove('d-none');
}

function hideMessageBox() {
    DOMElements.messageBox.classList.add('d-none');
    DOMElements.messageBoxBackdrop.classList.add('d-none');
}


    /**
     * Displays the current form step and updates the step indicators.
     * @param {number} step The index of the step to display.
     */
    function showStep(step) {
        DOMElements.formSteps.forEach((formStep, index) => {
            formStep.classList.toggle('d-none', index !== step);
        });

        DOMElements.stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === step);
        });
    }

    // --- Event Handlers ---

    /**
     * Handles the transition to the next step.
     */
    function handleNextStep() {
        const currentFormStep = DOMElements.formSteps[currentStep];
        const inputs = currentFormStep.querySelectorAll('input[required], select[required], textarea[required]');
        
        // Simple form validation: check if all required fields are filled
        const allFilled = Array.from(inputs).every(input => input.value.trim() !== '');

        if (allFilled) {
            currentStep++;
            if (currentStep < DOMElements.formSteps.length) {
                showStep(currentStep);
            }
        } else {
            // Display an error message if fields are not filled
            showMessageBox('!', 'Please fill out all required fields before proceeding.');
        }
    }

    /**
     * Handles the transition to the previous step.
     */
    function handlePrevStep() {
        currentStep--;
        if (currentStep >= 0) {
            showStep(currentStep);
        }
    }

    /**
     * Handles the form submission logic.
     * @param {Event} event The form submit event.
     */
    function handleFormSubmit(event) {
        event.preventDefault();

        // Object to hold all form data
        const formData = {
            personal: {},
            preferences: {}
        };

        // Populate personal data
        DOMElements.formSteps[0].querySelectorAll('input, select, textarea').forEach(field => {
            formData.personal[field.id] = field.value.trim();
        });
        
        // Populate preferences data
        DOMElements.formSteps[1].querySelectorAll('input, select, textarea').forEach(field => {
            if (field.type === 'checkbox') {
                if (!formData.preferences.prefValues) {
                    formData.preferences.prefValues = [];
                }
                if (field.checked) {
                    formData.preferences.prefValues.push(field.value);
                }
            } else {
                formData.preferences[field.id] = field.value.trim();
            }
        });

        // Log form data for debugging
        console.log('Form Data:', formData);

        // Placeholder for a real API call or logic
        showMessageBox('Application Submitted', 'Your application has been submitted successfully! Our team will review your information shortly.');

        // Reset the form and go back to the first step
        DOMElements.multiStepForm.reset();
        currentStep = 0;
        showStep(currentStep);
        DOMElements.registrationFormSection.style.display = 'none';
    }

    // --- Event Listeners ---

    // Buttons to navigate the multi-step form
    DOMElements.nextStepBtn.addEventListener('click', handleNextStep);
    DOMElements.prevStepBtn.addEventListener('click', handlePrevStep);

    // Form submission
    DOMElements.multiStepForm.addEventListener('submit', handleFormSubmit);

    // Handle message box close
    DOMElements.closeMessageBtn.addEventListener('click', hideMessageBox);

    // Buttons to show the registration form
    DOMElements.registerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOMElements.registrationFormSection.style.display = 'block';
            showStep(currentStep); // Show the first step when the form is displayed
        });
    });
});
