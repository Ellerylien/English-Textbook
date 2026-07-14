(function () {
  "use strict";

  if (!document.querySelector('link[href="nordic.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "nordic.css";
    document.head.appendChild(stylesheet);
  }

  const READY = document.readyState !== "loading";
  const onReady = (fn) => READY ? fn() : document.addEventListener("DOMContentLoaded", fn, { once: true });
  const parseJSON = (value) => {
    try { return JSON.parse(value); } catch (_) { return null; }
  };

  function replaceTag(element, tagName) {
    if (!element || element.tagName.toLowerCase() === tagName) return element;
    const replacement = document.createElement(tagName);
    [...element.attributes].forEach(attr => replacement.setAttribute(attr.name, attr.value));
    replacement.innerHTML = element.innerHTML;
    element.replaceWith(replacement);
    return replacement;
  }

  function initIndex() {
    document.body.classList.add("nordic-index");
    document.querySelector(".maintenance")?.remove();

    const comingCards = document.querySelectorAll('.unit-card[data-status="coming"]');
    const comingFilter = document.querySelector('.filter-btn[data-filter="coming"]');
    if (!comingCards.length && comingFilter) comingFilter.hidden = true;

    document.querySelectorAll(".filter-btn").forEach(button => {
      button.setAttribute("aria-controls", "unitList");
    });

    document.querySelectorAll('.unit-card[data-status="available"]').forEach(card => {
      card.addEventListener("click", () => {
        const number = Number(card.querySelector(".unit-index")?.textContent || 0);
        const title = card.querySelector(".unit-title")?.textContent?.trim() || "";
        const href = card.getAttribute("href") || "";
        localStorage.setItem("b4-reading-state", JSON.stringify({
          unitNumber: number,
          unitTitle: title,
          href,
          sectionId: "",
          sectionTitle: "",
          updatedAt: Date.now()
        }));
      });
    });

    const state = parseJSON(localStorage.getItem("b4-reading-state"));
    if (state?.href && state?.unitTitle) {
      const panel = document.getElementById("continuePanel");
      const title = document.getElementById("continueTitle");
      const link = document.getElementById("continueLink");
      if (panel && title && link) {
        title.textContent = state.sectionTitle
          ? `Unit ${state.unitNumber} · ${state.sectionTitle}`
          : state.unitTitle;
        link.href = state.sectionId ? `${state.href}#${state.sectionId}` : state.href;
        panel.classList.add("show");
      }
    }
  }

  function initMenu() {
    const sidebar = document.getElementById("sidebar");
    const button = document.getElementById("menuToggle") || document.getElementById("hamburger");
    const overlay = document.getElementById("backdrop") || document.getElementById("overlay");
    if (!sidebar || !button) return;

    sidebar.setAttribute("aria-label", "單元章節導覽");
    button.type = "button";
    button.setAttribute("aria-controls", "sidebar");
    button.setAttribute("aria-expanded", String(sidebar.classList.contains("open")));
    button.innerHTML = '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

    const sync = () => {
      const open = sidebar.classList.contains("open");
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
    };

    button.addEventListener("click", () => setTimeout(sync, 0));
    overlay?.addEventListener("click", () => setTimeout(sync, 0));
    new MutationObserver(sync).observe(sidebar, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape" || !sidebar.classList.contains("open")) return;
      sidebar.classList.remove("open");
      overlay?.classList.remove("show");
      sync();
      button.focus();
    });
  }

  function initAnswerAccessibility() {
    const setup = () => {
      document.querySelectorAll(".answer-btn").forEach((button, index) => {
        const item = button.closest(".practice-item");
        const answer = button.nextElementSibling?.classList.contains("answer-text")
          ? button.nextElementSibling
          : item?.querySelector(".answer-text");
        if (!answer) return;
        if (!answer.id) answer.id = `answer-${index + 1}`;
        button.type = "button";
        button.setAttribute("aria-controls", answer.id);
        const open = answer.dataset.open === "1" || getComputedStyle(answer).display !== "none";
        button.setAttribute("aria-expanded", String(open));
        button.addEventListener("click", () => {
          setTimeout(() => {
            const visible = answer.dataset.open === "1" || getComputedStyle(answer).display !== "none";
            button.setAttribute("aria-expanded", String(visible));
          }, 0);
        });
      });
    };
    setup();
    setTimeout(setup, 0);
  }

  function initQuizAccessibility() {
    document.querySelectorAll(".feedback, .score-done").forEach(status => {
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
    });

    document.addEventListener("click", event => {
      const option = event.target.closest?.(".quiz-option");
      if (!option) return;
      setTimeout(() => {
        const item = option.closest(".quiz-item");
        if (!item) return;
        let feedback = item.querySelector(".feedback, .quiz-feedback");
        if (!feedback) {
          feedback = document.createElement("div");
          feedback.className = "quiz-feedback";
          feedback.setAttribute("role", "status");
          feedback.setAttribute("aria-live", "polite");
          item.appendChild(feedback);
        }
        if (option.classList.contains("correct")) {
          feedback.textContent = "答對了。";
        } else if (option.classList.contains("wrong")) {
          const correct = item.querySelector(".quiz-option.correct");
          feedback.textContent = correct ? `答錯了。正確答案是 ${correct.textContent.trim()}` : "答錯了。";
        }
      }, 0);
    });
  }

  function initUnitNavigation() {
    document.body.classList.add("nordic-unit");
    const titleText = document.title;
    const unitNumber = Number(titleText.match(/Unit\s*(\d+)/i)?.[1] || 0);
    const heroTitle = document.querySelector(".course-hero h1, .hero-section h1")?.textContent?.trim() || `Unit ${unitNumber}`;
    const sidebar = document.getElementById("sidebar");

    document.querySelectorAll("h1.section-title").forEach(heading => replaceTag(heading, "h2"));
    document.querySelectorAll(".practice-heading h4").forEach(heading => replaceTag(heading, "h3"));

    if (sidebar && !sidebar.querySelector(".sidebar-footer")) {
      const footer = document.createElement("div");
      footer.className = "sidebar-footer";
      footer.innerHTML = `<a href="index.html">← 回到單元索引</a>${unitNumber < 10 ? `<a href="B4Unit${unitNumber + 1}.html">前往 Unit ${unitNumber + 1} →</a>` : ""}`;
      sidebar.appendChild(footer);
    }

    sidebar?.querySelectorAll('.sidebar-footer a[href="index.html"]').forEach(link => {
      link.textContent = "← 回到單元索引";
    });

    const sections = [...document.querySelectorAll(".section[id]")];
    const navLinks = [...document.querySelectorAll(".nav-links a")];
    const allSectionLinks = [...document.querySelectorAll(".nav-links a, .section-nav a[data-section]")];

    function targetFor(link) {
      if (link.dataset.section) return link.dataset.section;
      const inline = link.getAttribute("onclick") || "";
      return inline.match(/showSection\(['\"]([^'\"]+)/)?.[1] || "";
    }

    allSectionLinks.forEach(link => {
      const target = targetFor(link);
      if (!target) return;
      link.dataset.section = target;
      link.setAttribute("href", `#${target}`);
      link.removeAttribute("role");
      link.removeAttribute("tabindex");
    });

    function sectionLabel(id) {
      return document.getElementById(id)?.querySelector(".section-title")?.textContent?.trim() || id;
    }

    function persist(id) {
      localStorage.setItem("b4-reading-state", JSON.stringify({
        unitNumber,
        unitTitle: heroTitle,
        href: `B4Unit${unitNumber}.html`,
        sectionId: id,
        sectionTitle: sectionLabel(id),
        updatedAt: Date.now()
      }));
      localStorage.setItem("b4-last-unit", JSON.stringify({
        number: unitNumber,
        title: heroTitle,
        href: `B4Unit${unitNumber}.html#${id}`
      }));
    }

    function sync(id, pushHistory) {
      if (!id || !document.getElementById(id)) return;
      navLinks.forEach(link => {
        const current = targetFor(link) === id;
        link.classList.toggle("active", current);
        if (current) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      persist(id);
      if (pushHistory && location.hash !== `#${id}`) history.pushState({ section: id }, "", `#${id}`);
    }

    function showFromHistory() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id || !document.getElementById(id)) return;
      if (typeof window.showSection === "function") window.showSection(id);
      sync(id, false);
    }

    allSectionLinks.forEach(link => {
      link.addEventListener("click", event => {
        const id = targetFor(link);
        if (!id) return;
        event.preventDefault();
        setTimeout(() => {
          if (!document.getElementById(id)?.classList.contains("active") && typeof window.showSection === "function") {
            window.showSection(id);
          }
          sync(id, true);
        }, 0);
      });
    });

    window.addEventListener("popstate", showFromHistory);
    window.addEventListener("hashchange", showFromHistory);

    new MutationObserver(() => {
      const active = sections.find(section => section.classList.contains("active"));
      if (active) sync(active.id, false);
    }).observe(document.querySelector(".main-content") || document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });

    if (location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)))) {
      showFromHistory();
    } else {
      const active = sections.find(section => section.classList.contains("active")) || sections[0];
      if (active) {
        if (!active.classList.contains("active") && typeof window.showSection === "function") window.showSection(active.id);
        sync(active.id, false);
      }
    }
  }

  function initLegacyInteractions() {
    if (!document.querySelector(".course-hero")) return;

    const canAnimate = () => window.gsap
      && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    window.toggleAnswer = function (button) {
      const answer = button.nextElementSibling;
      if (!answer) return;
      const open = getComputedStyle(answer).display !== "none";
      button.setAttribute("aria-expanded", String(!open));

      if (open) {
        button.textContent = "顯示答案";
        if (canAnimate()) {
          gsap.killTweensOf(answer);
          gsap.to(answer, {
            autoAlpha: 0,
            y: -3,
            duration: 0.14,
            ease: "power1.in",
            onComplete: () => {
              answer.style.display = "none";
              gsap.set(answer, { clearProps: "opacity,visibility,transform" });
            }
          });
        } else {
          answer.style.display = "none";
        }
        return;
      }

      answer.style.display = "block";
      button.textContent = "隱藏答案";
      if (canAnimate()) {
        gsap.killTweensOf(answer);
        gsap.fromTo(answer, { autoAlpha: 0, y: -4 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.2,
          ease: "power2.out",
          clearProps: "opacity,visibility,transform"
        });
      }
    };

    const legacyCheckAnswer = window.checkAnswer;
    if (typeof legacyCheckAnswer === "function") {
      window.checkAnswer = function () {
        const result = legacyCheckAnswer.apply(this, arguments);
        if (window.gsap) {
          const quizId = arguments[0];
          const questionIndex = arguments[1];
          requestAnimationFrame(() => {
            const item = document.getElementById(quizId + "-q" + questionIndex);
            const options = item ? item.querySelectorAll(".quiz-option") : [];
            gsap.killTweensOf(options);
            gsap.set(options, { clearProps: "opacity,visibility,transform" });
          });
        }
        return result;
      };
    }
  }
  function initMotionDefaults() {
    if (!window.gsap) return;
    gsap.defaults({ ease: "power2.out", overwrite: "auto" });
    const media = gsap.matchMedia();
    const animated = ".course-hero, .hero-section, .brand-card, .nav-links li, .section, .answer-text";

    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.killTweensOf(animated);
      gsap.set(animated, { clearProps: "opacity,visibility,transform" });
    });

    if (!document.querySelector(".sidebar")) return;
    window.addEventListener("load", () => {
      const introTargets = gsap.utils.toArray(".course-hero, .hero-section, .brand-card, .nav-links li");
      const contentTargets = gsap.utils.toArray(".section.active .grammar-box, .section.active .practice-container, .section.active .quiz-item");
      gsap.killTweensOf(introTargets.concat(contentTargets));
      gsap.set(introTargets.concat(contentTargets), { clearProps: "opacity,visibility,transform" });

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
        timeline
          .fromTo(".course-hero, .hero-section", { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, clearProps: "opacity,visibility,transform" })
          .fromTo(".brand-card", { x: -6, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.24, clearProps: "opacity,visibility,transform" }, "-=0.16")
          .fromTo(".nav-links li", { x: -4, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.2, stagger: 0.025, clearProps: "opacity,visibility,transform" }, "-=0.12");
      });
    }, { once: true });
  }

  onReady(() => {
    document.documentElement.classList.add("nordic-ready");
    if (document.querySelector(".site-header")) initIndex();
    else initUnitNavigation();
    initMenu();
    initLegacyInteractions();
    initAnswerAccessibility();
    initQuizAccessibility();
    initMotionDefaults();
  });
})();
