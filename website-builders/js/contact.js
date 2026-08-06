// js/contact.js

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  
  if(contactForm) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const formMessage = document.getElementById('formMessage');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnIcon = submitBtn.querySelector('i');
    
    // Google Apps Script Web App URL
    // REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwAqsjZDhjjZW17_XM3s9YzMMRVS9BbZkeAJYFnPVzA3nJZNZkSmB1vLf-sX3VjUnLsEQ/exec';

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      
      // Basic Validation
      const name = contactForm.querySelector('#name').value.trim();
      const email = contactForm.querySelector('#email').value.trim();
      const phone = contactForm.querySelector('#phone').value.trim();
      const message = contactForm.querySelector('#message').value.trim();
      
      if(!name || !email || !phone || !message) {
        showMessage('Please fill in all required fields.', 'error');
        return;
      }

      // Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
      }

      // Phone Validation (simple length check)
      if(phone.length < 10) {
        showMessage('Please enter a valid phone number.', 'error');
        return;
      }

      // Message length validation
      if(message.length < 10) {
        showMessage('Message must be at least 10 characters long.', 'error');
        return;
      }

      // Disable button to prevent duplicate clicks
      submitBtn.disabled = true;
      btnText.textContent = 'Sending...';
      btnIcon.className = 'fa-solid fa-spinner fa-spin';

      // Use FormData to collect all form fields
      const formData = new FormData(contactForm);

      // Submit using Fetch API
      fetch(scriptURL, { 
        method: 'POST', 
        body: formData 
      })
      .then(response => {
        if(response.ok) {
          showMessage('Message sent successfully! We will get back to you soon.', 'success');
          contactForm.reset();
        } else {
          throw new Error('Network response was not ok.');
        }
      })
      .catch(error => {
        console.error('Error!', error.message);
        showMessage('Oops! Something went wrong. Please try again later.', 'error');
      })
      .finally(() => {
        // Reset button state
        submitBtn.disabled = false;
        btnText.textContent = 'Send Message';
        btnIcon.className = 'fa-regular fa-paper-plane';
      });
    });

    function showMessage(msg, type) {
      formMessage.textContent = msg;
      formMessage.className = `form-message ${type} reveal active fade-up`;
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        formMessage.classList.remove('active');
        setTimeout(() => {
          formMessage.textContent = '';
          formMessage.className = 'form-message';
        }, 800);
      }, 5000);
    }
  }
});
