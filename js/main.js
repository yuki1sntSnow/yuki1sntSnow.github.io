// Vue is loaded as a deferred script. By the time `defer`
// scripts run, the DOM is parsed and Vue is on `window`.
const app = Vue.createApp({
    mixins: Object.values(mixins),
    data() {
        return {
            hiddenMenu: false,
            showMenuItems: false,
            menuColor: false,
            scrollTop: 0,
            renderers: [],
        };
    },
    mounted() {
        window.addEventListener("scroll", this.handleScroll, true);
        this.render();
    },
    methods: {
        render() {
            for (const fn of this.renderers) fn();
        },
        handleScroll() {
            const wrap = this.$refs.homePostsWrap;
            const newScrollTop = document.documentElement.scrollTop;
            this.hiddenMenu = this.scrollTop < newScrollTop;
            if (this.hiddenMenu) this.showMenuItems = false;
            if (wrap) {
                this.menuColor = newScrollTop <= window.innerHeight - 100;
                // Parallax-pull the home posts wrap up — desktop only.
                // On mobile this caused the first card title to slip
                // under the fixed mobile-menu bar.
                if (window.matchMedia("(min-width: 900px)").matches) {
                    wrap.style.top = newScrollTop <= 400
                        ? "-" + newScrollTop / 5 + "px"
                        : "-80px";
                } else {
                    wrap.style.top = "0";
                }
            }
            this.scrollTop = newScrollTop;
        },
    },
});
app.mount("#layout");
