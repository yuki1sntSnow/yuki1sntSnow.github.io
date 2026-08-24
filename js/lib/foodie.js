document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-chef-carousel]").forEach((carousel) => {
        const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
        const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
        const previous = carousel.querySelector("[data-carousel-prev]");
        const next = carousel.querySelector("[data-carousel-next]");
        if (slides.length < 2) return;

        let current = 0;
        let touchStartX = null;

        const show = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                const active = slideIndex === current;
                slide.classList.toggle("is-active", active);
                slide.setAttribute("aria-hidden", String(!active));
            });
            dots.forEach((dot, dotIndex) => {
                const active = dotIndex === current;
                dot.classList.toggle("is-active", active);
                dot.setAttribute("aria-current", String(active));
            });
        };

        previous?.addEventListener("click", () => show(current - 1));
        next?.addEventListener("click", () => show(current + 1));
        dots.forEach((dot, index) => dot.addEventListener("click", () => show(index)));

        carousel.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                show(current - 1);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                show(current + 1);
            }
        });

        carousel.addEventListener("touchstart", (event) => {
            touchStartX = event.changedTouches[0]?.clientX ?? null;
        }, { passive: true });

        carousel.addEventListener("touchend", (event) => {
            if (touchStartX === null) return;
            const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
            const distance = touchEndX - touchStartX;
            touchStartX = null;
            if (Math.abs(distance) < 45) return;
            show(current + (distance < 0 ? 1 : -1));
        }, { passive: true });
    });
});
