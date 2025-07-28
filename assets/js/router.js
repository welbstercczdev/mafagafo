// assets/js/router.js (CORRIGIDO)
const router = {
    routes: {},
    appElement: document.getElementById('app'),
    repoName: '/mafagafo', // Nome do repositório no GitHub

    // Função para limpar o caminho da URL, removendo o nome do repositório
    getCleanPath(path) {
        if (path.startsWith(this.repoName)) {
            let cleanPath = path.substring(this.repoName.length);
            if (!cleanPath) { // Se o resultado for uma string vazia, significa que é a raiz
                return '/login';
            }
            return cleanPath;
        }
        // Se o caminho já for limpo (ex: /login), retorna como está
        return path === '/' ? '/login' : path;
    },

    add(path, view) {
        this.routes[path] = view;
    },

    async loadView(path) {
        try {
            // Usa a tag <base> para encontrar a view corretamente
            const response = await fetch(`views${path}.html`);
            if (!response.ok) throw new Error("Página não encontrada");
            return await response.text();
        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            // Carrega um 404 interno se a view não existir
            const errorResponse = await fetch('views/login.html'); 
            return await errorResponse.text();
        }
    },

    async resolve(path) {
        const cleanPath = this.getCleanPath(path);
        
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>';
        
        const viewPath = this.routes[cleanPath] || '/login.html';
        const html = await this.loadView(cleanPath);
        
        this.appElement.innerHTML = html;
        window.app.initPage(cleanPath);
    },

    handle(event) {
        event.preventDefault();
        const path = event.target.getAttribute('href'); // ex: "/login"
        const fullPath = this.repoName + path; // ex: "/mafagafo/login"
        history.pushState({ path: fullPath }, '', fullPath);
        this.resolve(fullPath);
    },

    init() {
        // Adiciona as rotas
        this.add('/login', 'views/login.html');
        this.add('/register', 'views/register.html');
        this.add('/dashboard', 'views/dashboard.html');

        let path;
        // Lógica de redirecionamento do 404.html
        if (sessionStorage.redirect) {
            path = new URL(sessionStorage.redirect).pathname;
            sessionStorage.removeItem('redirect');
            history.replaceState({ path: path }, '', path);
        } else {
            path = window.location.pathname;
        }

        // Garante que o usuário autenticado vá para o dashboard
        const token = localStorage.getItem('mafagafo_token');
        if (token && this.getCleanPath(path) === '/login') {
            const dashboardPath = this.repoName + '/dashboard';
            history.replaceState({ path: dashboardPath }, '', dashboardPath);
            this.resolve(dashboardPath);
        } else {
            this.resolve(path);
        }

        window.addEventListener('popstate', event => {
            const newPath = event.state ? event.state.path : (this.repoName + '/');
            this.resolve(newPath);
        });
    }
};

// O app.js irá chamar router.init()
window.router = router;
