// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Loading Animation
  const loader = document.querySelector('.loader-wrapper');
  if(loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }, 800);
  }

  // 2. Sticky Navbar & Mobile Menu
  const navbar = document.querySelector('.navbar');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if(navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars-staggered');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars-staggered');
      }
    });
  }

  // 3. Scroll Progress Bar
  const scrollProgress = document.getElementById('scroll-progress');
  if(scrollProgress) {
    window.addEventListener('scroll', () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollValue = `${(totalScroll / windowHeight) * 100}%`;
      scrollProgress.style.width = scrollValue;
    });
  }

  // 4. Scroll Reveal with Intersection Observer
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  };

  const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // 5. Animated Counter
  const counters = document.querySelectorAll('.stat-number');
  if(counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          const target = entry.target;
          const endValue = parseInt(target.getAttribute('data-target'));
          const duration = 2000;
          const stepTime = Math.abs(Math.floor(duration / endValue));
          let currentValue = 0;
          
          const timer = setInterval(() => {
            currentValue += Math.ceil(endValue / 50);
            if(currentValue >= endValue) {
              currentValue = endValue;
              clearInterval(timer);
            }
            target.textContent = currentValue;
          }, stepTime);
          
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
      counterObserver.observe(counter);
    });
  }

  // 6. FAQ Accordion
  const accordionHeaders = document.querySelectorAll('.faq-header');
  if (accordionHeaders.length > 0) {
    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const currentlyActive = document.querySelector('.faq-header.active');
        if (currentlyActive && currentlyActive !== header) {
          currentlyActive.classList.remove('active');
        }
        header.classList.toggle('active');
      });
    });
  }

  // Smooth scroll and fix for file:// protocol iframe hash navigation
  document.querySelectorAll('a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href) return;
      
      // Check if it's an anchor on the same page (e.g., "#about" or "index.html#about" when on index.html)
      const isHash = href.startsWith('#');
      const isCurrentPageHash = href.startsWith('index.html#') && window.location.pathname.endsWith('index.html');
      const isCurrentPageHashEmpty = href.startsWith('index.html#') && (window.location.pathname === '/' || window.location.pathname === '');

      if (isHash || isCurrentPageHash || isCurrentPageHashEmpty) {
        const targetId = isHash ? href : href.substring(href.indexOf('#'));
        const target = document.querySelector(targetId);
        
        if (target) {
          e.preventDefault(); // Prevent hash change which causes iframe security errors on file://
          
          if(navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            if(mobileMenuBtn) {
              const icon = mobileMenuBtn.querySelector('i');
              if(icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars-staggered');
              }
            }
          }
          
          window.scrollTo({
            top: target.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }
    });
  });

});
