document.addEventListener("DOMContentLoaded", () => {
    (function () {
        const form = document.getElementById("multiStepForm");
        const cards = Array.from(form.querySelectorAll(".card[data-step]"));
        const totalSteps = cards.length;
        let currentIndex = 0;

        const stepItems = Array.from(document.querySelectorAll(".step-item"));

        // === Loading Overlay References (New) ===
        const loadingOverlay = document.getElementById("loadingOverlay");

        /**
         * Shows the full-screen loading overlay.
         */
        function showLoading() {
            if (loadingOverlay) {
                loadingOverlay.style.display = "flex";
            }
        }

        /**
         * Hides the full-screen loading overlay.
         */
        function hideLoading() {
            if (loadingOverlay) {
                loadingOverlay.style.display = "none";
            }
        }

        // === Step Control ===
        function showStep(index) {
            cards.forEach((c, i) => c.classList.toggle("active", i === index));
            stepItems.forEach((si, i) => si.classList.toggle("active", i === index));
        }

        function validateStep(card) {
            let valid = true;
            const inputs = Array.from(card.querySelectorAll("[required]"));
            
            // 1. Validate standard required inputs
            inputs.forEach((input) => {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    valid = false;
                }
            });

            // 2. Custom checkbox group validation (min checked count)
            const minCheckboxes = Array.from(card.querySelectorAll('input[type="checkbox"][data-min]'));
            minCheckboxes.forEach((checkbox) => {
                const groupName = checkbox.name;
                const minCount = parseInt(checkbox.getAttribute("data-min"), 10);
                const checkedCount = form.querySelectorAll(`input[name="${groupName}"]:checked`).length;
                if (checkedCount < minCount) valid = false;
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

        // === Rating/Image selection (UNCHANGED) ===
        const ratingOptions = document.querySelectorAll(".rating-options");
        ratingOptions.forEach((grid) => {
            grid.addEventListener("click", function (e) {
                const item = e.target.closest(".rating-option");
                if (item) {
                    const targetInputName = grid.getAttribute("data-target");
                    const targetInput = form.querySelector(`input[type="hidden"][name="${targetInputName}"]`);
                    if (targetInput) {
                        grid.querySelectorAll(".rating-option").forEach((o) => o.classList.remove("selected"));
                        item.classList.add("selected");
                        targetInput.value = item.getAttribute("data-value");
                    }
                }
            });
        });

        const imageSelectionGrids = document.querySelectorAll(".image-selection-grid");
        imageSelectionGrids.forEach((grid) => {
            grid.addEventListener("click", function (e) {
                const item = e.target.closest(".image-item");
                if (item) {
                    const targetInputName = grid.getAttribute("data-target");
                    const targetInput = form.querySelector(`input[type="hidden"][name="${targetInputName}"]`);
                    if (targetInput) {
                        grid.querySelectorAll(".image-item").forEach((img) => img.classList.remove("selected"));
                        item.classList.add("selected");
                        targetInput.value = item.getAttribute("data-value");
                    }
                }
            });
        });

        // === Convert File to Base64 (UNCHANGED) ===
        function toBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
            });
        }

        // === Handle Form Submission (FIXED LOGIC) ===
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            // 1. Validate the final step before proceeding
            if (!validateStep(cards[currentIndex])) return;

            // 2. SHOW LOADING NOTIFICATION
            showLoading(); 

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Define fields that are checkboxes and need aggregation
            const multiValueFields = [
                'ethnic_preferences',
                'religious_preferences',
                'relationship_importance',
                'interests',
                'age_ranges'
            ];

            // Collect all checked values
            multiValueFields.forEach(name => {
                const checkedValues = Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(
                    el => el.value
                );
                data[name] = checkedValues.join(", ");
            });

            // Handle file upload (convert to base64)
            const profileInput = form.querySelector('input[name="profile_image"]');
            if (profileInput && profileInput.files.length > 0) {
                try {
                    data.profile_image = await toBase64(profileInput.files[0]);
                } catch (error) {
                    console.error("File Conversion Error:", error);
                    hideLoading();
                    showMessageBox("Error", "Could not process image file.");
                    return;
                }
            } else {
                data.profile_image = "";
            }

            try {
                const response = await fetch("https://miwalletmw.com:7000/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                // 3. HIDE LOADING NOTIFICATION (on success or failure)
                hideLoading(); 

                const result = await response.json();
                if (response.ok && result.success) {
                    showMessageBox("Registration Complete! 🎉", "Thank you for completing your profile.");
                    form.reset();
                    // Optional: return to first step
                    currentIndex = 0; 
                    showStep(currentIndex);
                } else {
                    // Display the specific database or server error message
                    showMessageBox("Registration Failed 😔", result.message || "Server error occurred.");
                }
            } catch (error) {
                // 3. HIDE LOADING NOTIFICATION (on network error)
                hideLoading(); 
                console.error("Submit Error:", error);
                showMessageBox("Network Error 🌐", "Could not submit your registration. Please check your connection and try again.");
            }
        });

        // === Message Box (UNCHANGED) ===
        const messageBoxBackdrop = document.getElementById("messageBoxBackdrop");
        const messageTitle = document.getElementById("messageTitle");
        const messageText = document.getElementById("messageText");
        const closeMessageBtn = document.getElementById("closeMessageBtn");

        function showMessageBox(title, text) {
            messageTitle.textContent = title;
            messageText.textContent = text;
            messageBoxBackdrop.style.display = "flex";
        }

        closeMessageBtn.addEventListener("click", function () {
            messageBoxBackdrop.style.display = "none";
        });
        
        // Initialize the first step visibility
        showStep(currentIndex);
    })();
});