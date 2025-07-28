// assets/js/router.js
const router = {
    routes: {},
    appElement: document.getElementById('app'),

    add(path, view) {
        this.routes[path] = view;
    },

    async loadView(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error("Página não encontrada");
            return await response.text();
        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            const errorResponse = await fetch('views/404.html');
            return await errorResponse.text();
        }
    },

    async resolve(path) {
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>'; // Mostra loader
        const viewPath = this.routes[path] || 'views/404.html';
        const html = await this.loadView(viewPath);
        this.appElement.innerHTML = html;
        window.app.initPage(path); // Chama o inicializador da página
    },

    handle(event) {
        event.preventDefault();
        const path = event.target.getAttribute('href');
        history.pushState({ path }, '', path);
        this.resolve(path);
    },

    init() {
        // Redirecionamento do 404.html
        if (sessionStorage.redirect) {
            const path = new URL(sessionStorage.redirect).pathname;
            sessionStorage.removeItem('redirect');
            history.replaceState({ path }, '', path);
        }
        
        window.addEventListener('popstate', event => {
            const path = event.state ? event.state.path : '/';
            this.resolve(path);
        });

        const currentPath = window.location.pathname;
        this.resolve(currentPath === '/' ? '/login' : currentPath);
    }
};

window.router = router;
