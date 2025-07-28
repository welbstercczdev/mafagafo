// assets/js/router.js (VERSÃO FINAL E CORRETA)
const router = {
    appElement: document.getElementById('app'),
    repoName: '/mafagafo',

    // Função que limpa a URL para obter a rota desejada (ex: /login)
    getCleanPath(path) {
        if (path.startsWith(this.repoName)) {
            let cleanPath = path.substring(this.repoName.length);
            // Se for a raiz do projeto, define como /login. ESSA É A CHAVE.
            return cleanPath || '/login'; 
        }
        return path === '/' ? '/login' : path;
    },

    // Carrega o conteúdo HTML de uma view
    async loadView(path) {
        try {
            const response = await fetch(`views${path}.html`);
            if (!response.ok) throw new Error(`View não encontrada: ${path}`);
            return await response.text();
        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            // Se uma view não for encontrada, carrega o login como segurança.
            return await (await fetch('views/login.html')).text();
        }
    },

    // A função central que decide o que mostrar na tela.
    async resolve(path) {
        // 1. Limpa a tela e mostra um loader.
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>';
        
        let cleanPath = this.getCleanPath(path);

        // 2. LÓGICA DE PROTEÇÃO DE ROTA (centralizada aqui)
        const userIsLoggedIn = !!window.app.state.user;

        if ((cleanPath === '/login' || cleanPath === '/register') && userIsLoggedIn) {
            cleanPath = '/dashboard'; // Se logado, não pode ver login/registro.
            history.replaceState({ path: this.repoName + cleanPath }, '', this.repoName + cleanPath);
        }
        if (cleanPath === '/dashboard' && !userIsLoggedIn) {
            cleanPath = '/login'; // Se não logado, não pode ver o dashboard.
            history.replaceState({ path: this.repoName + cleanPath }, '', this.repoName + cleanPath);
        }

        // 3. Carrega e exibe o HTML da view correta.
        const html = await this.loadView(cleanPath);
        this.appElement.innerHTML = html;
        
        // 4. Chama o app.js para adicionar a interatividade (eventos de clique).
        window.app.initPage(cleanPath);
    },

    // Lida com cliques em links internos da aplicação
    handle(event) {
        event.preventDefault();
        const fullPath = this.repoName + event.target.getAttribute('href');
        history.pushState({ path: fullPath }, '', fullPath);
        this.resolve(fullPath);
    },

    // Ponto de entrada do roteador
    init() {
        let initialPath = window.location.pathname;
        if (sessionStorage.redirect) {
            initialPath = new URL(sessionStorage.redirect).pathname;
            sessionStorage.removeItem('redirect');
            history.replaceState({ path: initialPath }, '', initialPath);
        }
        
        this.resolve(initialPath);

        // Ouve os botões "voltar/avançar" do navegador
        window.addEventListener('popstate', e => {
            const path = e.state ? e.state.path : this.repoName + '/';
            this.resolve(path);
        });
    }
};

window.router = router;
