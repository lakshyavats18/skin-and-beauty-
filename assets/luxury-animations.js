/**
 * Tenicide Luxury Skincare Interactive Experience & Micro-animations
 */

(function () {
  'use strict';

  // 1. Scroll Reveal Observer
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '.fade-in-up, .luxury-hero, .trust-badges-section, .skincare-routine-section, .testimonials-section, .editorial-banner-section'
    );

    if (!revealElements.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
      );

      revealElements.forEach((el) => {
        el.classList.add('fade-in-up');
        observer.observe(el);
      });
    } else {
      revealElements.forEach((el) => el.classList.add('is-visible'));
    }
  }

  // 2. Skincare Routine Tabs Switcher
  function initRoutineTabs() {
    const routineContainers = document.querySelectorAll('.skincare-routine-container');
    routineContainers.forEach((container) => {
      const tabs = container.querySelectorAll('.routine-tab-btn');
      const cards = container.querySelectorAll('.routine-step-panel');

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const stepIndex = tab.getAttribute('data-step');

          tabs.forEach((t) => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          cards.forEach((c) => {
            c.classList.remove('active');
            c.hidden = true;
          });

          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');

          const targetPanel = container.querySelector(`.routine-step-panel[data-step="${stepIndex}"]`);
          if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.hidden = false;
          }
        });
      });
    });
  }

  // 3. Luxury FAQ Accordion (Handles both custom schema blocks & raw page.content parsing)
  function initLuxuryFAQ() {
    const accordions = document.querySelectorAll('.luxury-faq-item');
    accordions.forEach((item) => {
      const trigger = item.querySelector('.luxury-faq-question');
      const content = item.querySelector('.luxury-faq-answer');

      if (!trigger || !content) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        const parentList = item.closest('.luxury-faq-list');

        // Optional single-open accordion behavior
        if (parentList && parentList.dataset.allowMultiple !== 'true') {
          parentList.querySelectorAll('.luxury-faq-item').forEach((sibling) => {
            if (sibling !== item) {
              sibling.classList.remove('is-open');
              const sibAnswer = sibling.querySelector('.luxury-faq-answer');
              const sibTrigger = sibling.querySelector('.luxury-faq-question');
              if (sibAnswer) sibAnswer.style.maxHeight = null;
              if (sibTrigger) sibTrigger.setAttribute('aria-expanded', 'false');
            }
          });
        }

        if (isOpen) {
          item.classList.remove('is-open');
          content.style.maxHeight = null;
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          content.style.maxHeight = content.scrollHeight + 'px';
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Fallback parser for standard page.content if rendered without schema blocks
    const legacyContent = document.querySelector('[data-luxury-faq-content]');
    if (legacyContent && !legacyContent.dataset.parsed) {
      const headings = legacyContent.querySelectorAll('h2, h3, h4, strong');
      if (headings.length > 0) {
        legacyContent.dataset.parsed = 'true';
        // Auto-transform headings and following paragraphs into interactive accordions
        const parsedWrapper = document.createElement('div');
        parsedWrapper.className = 'luxury-faq-list parsed-fallback';

        headings.forEach((heading) => {
          const itemEl = document.createElement('div');
          itemEl.className = 'luxury-faq-item';

          const questionBtn = document.createElement('button');
          questionBtn.className = 'luxury-faq-question';
          questionBtn.type = 'button';
          questionBtn.setAttribute('aria-expanded', 'false');
          questionBtn.innerHTML = `<span>${heading.textContent}</span><span class="faq-icon">+</span>`;

          const answerDiv = document.createElement('div');
          answerDiv.className = 'luxury-faq-answer';

          let next = heading.nextElementSibling;
          const contentBag = document.createElement('div');
          contentBag.className = 'luxury-faq-answer-inner';

          while (next && !['H2', 'H3', 'H4'].includes(next.tagName)) {
            const clone = next.cloneNode(true);
            contentBag.appendChild(clone);
            const temp = next.nextElementSibling;
            next.remove();
            next = temp;
          }

          if (contentBag.children.length === 0) {
            contentBag.innerHTML = '<p>Please contact our concierge for further details.</p>';
          }

          answerDiv.appendChild(contentBag);
          itemEl.appendChild(questionBtn);
          itemEl.appendChild(answerDiv);
          parsedWrapper.appendChild(itemEl);
          heading.remove();
        });

        legacyContent.appendChild(parsedWrapper);
        initLuxuryFAQ(); // Re-bind newly generated items
      }
    }
  }

  // 4. Testimonials Carousel
  function initTestimonialsCarousel() {
    const carousels = document.querySelectorAll('.testimonials-carousel-wrapper');
    carousels.forEach((carousel) => {
      const track = carousel.querySelector('.testimonials-track');
      const slides = carousel.querySelectorAll('.testimonial-card');
      const prevBtn = carousel.querySelector('.carousel-nav-btn--prev');
      const nextBtn = carousel.querySelector('.carousel-nav-btn--next');
      const dotsContainer = carousel.querySelector('.carousel-dots');

      if (!slides.length || !track) return;

      let currentIndex = 0;

      function updateSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        currentIndex = index;

        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        if (dotsContainer) {
          const dots = dotsContainer.querySelectorAll('.carousel-dot');
          dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
        }
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', () => updateSlide(currentIndex - 1));
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => updateSlide(currentIndex + 1));
      }

      // Auto-play every 6 seconds
      let timer = setInterval(() => updateSlide(currentIndex + 1), 6000);
      carousel.addEventListener('mouseenter', () => clearInterval(timer));
      carousel.addEventListener('mouseleave', () => {
        clearInterval(timer);
        timer = setInterval(() => updateSlide(currentIndex + 1), 6000);
      });
    });
  }

  // Run all on DOMContentLoaded and Shopify section reloads
  function initialize() {
    initScrollReveal();
    initRoutineTabs();
    initLuxuryFAQ();
    initTestimonialsCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Support Shopify Theme Customizer section events
  document.addEventListener('shopify:section:load', initialize);
  document.addEventListener('shopify:section:select', initialize);
})();
