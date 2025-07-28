// assets/js/router.js (VERSÃO FINAL E CORRETA)
const router = {
    appElement: document.getElementById('app'),
    repoName: '/mafagafo',

    getCleanPath(path) {
        if (path.startsWith(this.repoName)) {
            let cleanPath = path.substring(this.repoName.length);
            return cleanPath || '/login';
        }
        return path === '/' ? '/login' : path;
    },

    async loadView(path) {
        try {
            const response = await fetch(`views${path}.html`);
            if (!response.ok) throw new Error(`View não encontrada: ${path}`);
            return await response.text();
        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            return await (await fetch('views/login.html')).text();
        }
    },

    async resolve(path) {
        // Limpa o conteúdo antigo e mostra um loader.
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>';
        
        const cleanPath = this.getCleanPath(path);
        
        // **LÓGICA DE NAVEGAÇÃO MOVIDA PARA CÁ**
        // Se o usuário está logado e tenta acessar login/register, muda o caminho para o dashboard.
        if ((cleanPath === '/login' || cleanPath === '/register') && window.app.state.user) {
            history.replaceState({ path: this.repoName + '/dashboard' }, '', this.repoName + '/dashboard');
            return this.resolve(this.repoName + '/dashboard'); // Reinicia o resolve com o caminho correto.
        }
        // Se o usuário NÃO está logado e tenta acessar o dashboard, muda o caminho para o login.
        if (cleanPath === '/dashboard' && !window.app.state.user) {
            history.replaceState({ path: this.repoName + '/login' }, '', this.repoName + '/login');
            return this.resolve(this.repoName + '/login');
        }

        const html = await this.loadView(cleanPath);
        this.appElement.innerHTML = html; // Substitui o loader pelo conteúdo final.
        window.app.initPage(cleanPath); // Chama o app.js para adicionar eventos.
    },

    handle(event) {
        event.preventDefault();
        const relativePath = event.target.getAttribute('href');
        const fullPath = this.repoName + relativePath;
        history.pushState({ path: fullPath }, '', fullPath);
        this.resolve(fullPath);
    },

    init() {
        let path;
        if (sessionStorage.redirect) {
            path = new URL(sessionStorage.redirect).pathname;
            sessionStorage.removeItem('redirect');
            history.replaceState({ path }, '', path);
        } else {
            path = window.location.pathname;
        }
        this.resolve(path);
        window.addEventListener('popstate', e => this.resolve(e.state ? e.state.path : this.repoName + '/'));
    }
};

window.router = router;
