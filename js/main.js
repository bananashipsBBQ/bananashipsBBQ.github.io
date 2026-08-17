(() => {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection && navigator.connection.saveData;

  root.classList.add("js");

  const setExpanded = (trigger, expanded) => {
    trigger.setAttribute("aria-expanded", String(expanded));
  };

  const togglePanel = (trigger, panel) => {
    if (!panel) return;
    const expanded = panel.hidden;
    panel.hidden = !expanded;
    setExpanded(trigger, expanded);
  };

  const scrollToTop = (event) => {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
  };

  const initializeHeader = () => {
    const title = document.querySelector("#header #title h1");
    if (title) title.dataset.text = title.textContent.trim();

    const header = document.querySelector("#header");
    if (header && !header.nextElementSibling?.classList.contains("site-signal")) {
      const signal = document.createElement("div");
      signal.className = "site-signal";
      signal.setAttribute("aria-hidden", "true");
      signal.innerHTML = [
        '<span class="signal-beacon"></span>',
        '<span>REVERSE / ANDROID / IoT / CTF</span>',
        '<span class="signal-code">0xB4</span>'
      ].join("");
      header.insertAdjacentElement("afterend", signal);
    }

    const menuTrigger = document.querySelector("#header > #nav > ul > .icon > a");
    const menuList = document.querySelector("#header > #nav > ul");
    if (menuTrigger && menuList) {
      menuTrigger.setAttribute("role", "button");
      setExpanded(menuTrigger, false);
      menuTrigger.addEventListener("click", (event) => {
        event.preventDefault();
        const expanded = menuList.classList.toggle("responsive");
        setExpanded(menuTrigger, expanded);
      });
    }
  };

  const initializeArticleControls = () => {
    const articleMenu = document.querySelector("#header-post #menu");
    const articleMenuTriggers = document.querySelectorAll("#menu-icon, #menu-icon-tablet");
    const articleMenuVisible = window.innerWidth >= 1440;

    if (articleMenu) articleMenu.hidden = !articleMenuVisible;

    articleMenuTriggers.forEach((trigger) => {
      setExpanded(trigger, articleMenuVisible);
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (!articleMenu) return;
        const expanded = articleMenu.hidden;
        articleMenu.hidden = !expanded;
        articleMenuTriggers.forEach((item) => {
          item.classList.toggle("active", expanded);
          setExpanded(item, expanded);
        });
      });
    });

    document.querySelectorAll('[aria-label="返回顶部"], #top-icon-tablet, #actions-footer #top')
      .forEach((trigger) => trigger.addEventListener("click", scrollToTop));

    const shareTrigger = document.querySelector('#header-post #actions [aria-label="分享文章"]');
    const sharePanel = document.querySelector("#header-post #share");
    if (shareTrigger && sharePanel) {
      sharePanel.hidden = true;
      setExpanded(shareTrigger, false);
      shareTrigger.addEventListener("click", (event) => {
        event.preventDefault();
        togglePanel(shareTrigger, sharePanel);
      });
    }

    const footerPanels = [
      ["#actions-footer #menu", "#nav-footer"],
      ["#actions-footer #toc", "#toc-footer"],
      ["#actions-footer #share", "#share-footer"]
    ];

    footerPanels.forEach(([triggerSelector, panelSelector]) => {
      const trigger = document.querySelector(triggerSelector);
      const panel = document.querySelector(panelSelector);
      if (!trigger || !panel) return;
      panel.hidden = true;
      setExpanded(trigger, false);
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        footerPanels.forEach(([, otherPanelSelector]) => {
          const otherPanel = document.querySelector(otherPanelSelector);
          if (otherPanel && otherPanel !== panel) otherPanel.hidden = true;
        });
        togglePanel(trigger, panel);
      });
    });

    if (articleMenu && articleMenuVisible) {
      articleMenuTriggers.forEach((trigger) => trigger.classList.add("active"));
    }
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  };

  const initializeCodeCopy = () => {
    document.querySelectorAll(".highlight table").forEach((table) => {
      if (table.previousElementSibling?.classList.contains("btn-copy")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn-copy";
      button.setAttribute("aria-label", "复制代码");
      button.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i>';
      table.insertAdjacentElement("beforebegin", button);

      button.addEventListener("click", async () => {
        const text = Array.from(table.querySelectorAll(".code"))
          .map((code) => code.innerText)
          .join("\n");
        try {
          await copyText(text);
          button.classList.add("is-copied");
          button.setAttribute("aria-label", "已复制");
          window.setTimeout(() => {
            button.classList.remove("is-copied");
            button.setAttribute("aria-label", "复制代码");
          }, 1600);
        } catch (_error) {
          button.setAttribute("aria-label", "复制失败");
        }
      });
    });
  };

  const initializeFriendAvatars = () => {
    document.querySelectorAll(".friend-avatar").forEach((image) => {
      const useFallback = () => {
        if (image.dataset.fallback === "true") return;
        image.dataset.fallback = "true";
        image.src = "/images/logo-128.webp";
        image.alt = "";
        image.classList.add("is-fallback");
      };

      image.addEventListener("error", useFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) useFallback();
    });
  };

  const initializeReadingProgress = () => {
    const progress = document.createElement("div");
    progress.id = "reading-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    let ticking = false;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;

      const topControl = document.querySelector("#actions-footer #top");
      if (topControl) topControl.hidden = window.scrollY < 100;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  };

  const initializeSignalField = () => {
    const canvas = document.createElement("canvas");
    canvas.id = "signal-field";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let points = [];
    let frameId = 0;
    let lastFrame = 0;
    const pointer = { x: -1000, y: -1000 };
    const animate = !reducedMotion.matches && !saveData;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(14, Math.min(34, Math.floor(width / 44)));
      points = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        color: index % 5 === 0 ? "255, 107, 95" : index % 2 === 0 ? "88, 214, 199" : "196, 116, 255"
      }));
      draw();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        context.fillStyle = `rgba(${point.color}, 0.32)`;
        context.fillRect(point.x, point.y, 1.4, 1.4);

        for (let j = i + 1; j < points.length; j += 1) {
          const other = points[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > 128) continue;
          context.strokeStyle = `rgba(${point.color}, ${(1 - distance / 128) * 0.1})`;
          context.lineWidth = 0.7;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }

        const pointerDistance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        if (pointerDistance < 150) {
          context.strokeStyle = `rgba(88, 214, 199, ${(1 - pointerDistance / 150) * 0.22})`;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(pointer.x, pointer.y);
          context.stroke();
        }
      }
    };

    const loop = (time) => {
      if (time - lastFrame >= 42) {
        lastFrame = time;
        points.forEach((point) => {
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < 0 || point.x > width) point.vx *= -1;
          if (point.y < 0 || point.y > height) point.vy *= -1;
        });
        draw();
      }
      frameId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!animate) return;
      if (document.hidden) {
        window.cancelAnimationFrame(frameId);
      } else {
        frameId = window.requestAnimationFrame(loop);
      }
    });

    resize();
    if (animate) frameId = window.requestAnimationFrame(loop);
  };

  const initialize = () => {
    initializeHeader();
    initializeArticleControls();
    initializeCodeCopy();
    initializeFriendAvatars();
    initializeReadingProgress();
    initializeSignalField();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
