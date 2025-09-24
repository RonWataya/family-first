document.addEventListener('DOMContentLoaded', () => {
    
    // Multi-step logic
   // Multi-step logic
    (function () {
      const form = document.getElementById('multiStepForm');
      const cards = Array.from(form.querySelectorAll('.card[data-step]'));
      const totalSteps = cards.length;
      let currentIndex = 0;

      // Step indicator items
      const stepItems = Array.from(document.querySelectorAll('.step-item'));

      // Initialize display
      function showStep(index) {
        cards.forEach((c, i) => {
          c.classList.toggle('active', i === index);
        });
        stepItems.forEach((si, i) => {
          si.classList.toggle('active', i === index);
        });
      }

      function validateStep(card) {
        let valid = true;
        const inputs = Array.from(card.querySelectorAll('[required]'));
        inputs.forEach(input => {
          input.reportValidity();
          if (!input.checkValidity()) {
            valid = false;
          }
        });

        // Custom validation for min-checked checkboxes
        const minCheckboxes = Array.from(card.querySelectorAll('input[type="checkbox"][data-min]'));
        minCheckboxes.forEach(checkbox => {
          const groupName = checkbox.name;
          const minCount = parseInt(checkbox.getAttribute('data-min'), 10);
          const checkedCount = form.querySelectorAll(`input[name="${groupName}"]:checked`).length;
          const isGroupValid = checkedCount >= minCount;

          if (!isGroupValid) {
            valid = false;
            // You might want to show a custom validation message here
            console.error(`Please select at least ${minCount} option(s) for ${groupName}`);
          }
        });

        return valid;
      }

      window.nextStep = function () {
        if (validateStep(cards[currentIndex])) {
          if (currentIndex < totalSteps - 1) {
            currentIndex++;
            showStep(currentIndex);
          }
        }
      };

      window.prevStep = function () {
        if (currentIndex > 0) {
          currentIndex--;
          showStep(currentIndex);
        }
      };

      // Rating/Image selection
      const ratingOptions = document.querySelectorAll('.rating-options');
      ratingOptions.forEach(grid => {
        grid.addEventListener('click', function (e) {
          const item = e.target.closest('.rating-option');
          if (item) {
            const targetInputName = grid.getAttribute('data-target');
            const targetInput = form.querySelector(`input[type="hidden"][name="${targetInputName}"]`);
            if (targetInput) {
              // Reset all options
              grid.querySelectorAll('.rating-option').forEach(option => option.classList.remove('selected'));
              // Select the clicked item
              item.classList.add('selected');
              // Set the value of the hidden input
              targetInput.value = item.getAttribute('data-value');
            }
          }
        });
      });

      const imageSelectionGrids = document.querySelectorAll('.image-selection-grid');
      imageSelectionGrids.forEach(grid => {
        grid.addEventListener('click', function (e) {
          const item = e.target.closest('.image-item');
          if (item) {
            const targetInputName = grid.getAttribute('data-target');
            const targetInput = form.querySelector(`input[type="hidden"][name="${targetInputName}"]`);
            if (targetInput) {
              // Reset all image items
              grid.querySelectorAll('.image-item').forEach(img => img.classList.remove('selected'));
              // Select the clicked item
              item.classList.add('selected');
              // Set the value of the hidden input
              targetInput.value = item.getAttribute('data-value');
            }
          }
        });
      });

      // Form submission
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (validateStep(cards[currentIndex])) {
          // You can handle form submission here (e.g., via AJAX)
          showMessageBox('Application Submitted!', 'Thank you for completing your profile. Our team will review your information shortly.');
        }
      });

      // Message box logic
      const messageBoxBackdrop = document.getElementById('messageBoxBackdrop');
      const messageTitle = document.getElementById('messageTitle');
      const messageText = document.getElementById('messageText');
      const closeMessageBtn = document.getElementById('closeMessageBtn');

      function showMessageBox(title, text) {
        messageTitle.textContent = title;
        messageText.textContent = text;
        messageBoxBackdrop.style.display = 'flex';
      }

      closeMessageBtn.addEventListener('click', function() {
        messageBoxBackdrop.style.display = 'none';
      });

    })();
  
});