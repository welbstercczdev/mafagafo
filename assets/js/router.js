// assets/js/router.js (VERSÃO FINAL, ROBUSTA E CORRETA)
const router = {
    appElement: document.getElementById('app'),
    repoName: '/mafagafo',

    // Função que limpa a URL para obter a rota desejada (ex: /login)
    getCleanPath(path) {
        let cleanPath = path;
        // Remove o nome do repositório se ele existir no início do caminho
        if (path.startsWith(this.repoName)) {
            cleanPath = path.substring(this.repoName.length);
        }

        // A correção crítica: se o caminho resultante for a raiz do projeto (vazio ou '/'),
        // nós FORÇAMOS que a rota seja '/login'. Isso resolve o erro "View não encontrada: /".
        if (cleanPath === '' || cleanPath === '/') {
            return '/login';
        }
        
        return cleanPath;
    },

    // Carrega o conteúdo HTML de uma view
    async loadView(path) {
        try {
            // Agora 'path' nunca será '/', ele será sempre algo como '/login'
            const response = await fetch(`views${path}.html`);
            if (!response.ok) throw new Error(`View não encontrada em views${path}.html`);
            return await response.text();
        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            // Fallback de segurança: se tudo mais falhar, mostra a página de login.
            return await (await fetch('views/login.html')).text();
        }
    },

    // A função central que decide o que mostrar na tela
    async resolve(path) {
        // 1. Limpa a tela e mostra um loader para o usuário
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>';
        
        let cleanPath = this.getCleanPath(path);

        // 2. Lógica de Proteção de Rota (centralizada aqui para evitar loops)
        const userIsLoggedIn = !!window.app.state.user;

        if ((cleanPath === '/login' || cleanPath === '/register') && userIsLoggedIn) {
            cleanPath = '/dashboard';
            history.replaceState({ path: this.repoName + cleanPath }, '', this.repoName + cleanPath);
        }
        if (cleanPath === '/dashboard' && !userIsLoggedIn) {
            cleanPath = '/login';
            history.replaceState({ path: this.repoName + cleanPath }, '', this.repoName + cleanPath);
        }

        // 3. Carrega e exibe o HTML da view correta
        const html = await this.loadView(cleanPath);
        this.appElement.innerHTML = html;
        
        // 4. Chama o app.js APENAS para adicionar a interatividade (eventos de clique)
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
        // Lida com redirecionamentos do 404.html
        if (sessionStorage.redirect) {
            initialPath = new URL(sessionStorage.redirect).pathname;
            sessionStorage.removeItem('redirect');
            history.replaceState({ path: initialPath }, '', initialPath);
        }
        
        // Resolve a rota inicial
        this.resolve(initialPath);

        // Ouve os botões "voltar/avançar" do navegador
        window.addEventListener('popstate', e => {
            const path = e.state ? e.state.path : this.repoName + '/';
            this.resolve(path);
        });
    }
};

window.router = router;
