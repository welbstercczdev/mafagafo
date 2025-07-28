// assets/js/router.js (ARQUITETURA FINAL E DEFINITIVA)
const router = {
    appElement: document.getElementById('app'),
    repoName: '/mafagafo',

    // Função pública para pedir uma navegação. É o único ponto de entrada para o app.js.
    navigate(path, doPushState = true) {
        const fullPath = this.repoName + path;
        if (doPushState && window.location.pathname !== fullPath) {
            history.pushState({ path: fullPath }, '', fullPath);
        }
        this.resolve(fullPath);
    },

    // Função interna que executa a renderização.
    async resolve(path) {
        // 1. Limpa a tela imediatamente para garantir que não haja conteúdo duplicado.
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>';
        
        let cleanPath = this._getCleanPath(path);
        
        // 2. Lógica de proteção de rota (agora centralizada e segura).
        const userIsLoggedIn = !!window.app.state.user;
        if ((cleanPath === '/login' || cleanPath === '/register') && userIsLoggedIn) {
            this.navigate('/dashboard', false); // Navega sem criar nova entrada no histórico.
            return;
        }
        if (cleanPath === '/dashboard' && !userIsLoggedIn) {
            this.navigate('/login', false);
            return;
        }

        // 3. Carrega e exibe o HTML da view correta.
        try {
            const html = await this._loadView(cleanPath);
            this.appElement.innerHTML = html;
            // 4. Apenas no final, chama o app.js para adicionar a interatividade.
            window.app.initPage(cleanPath);
        } catch (error) {
            console.error(error);
            this.appElement.innerHTML = '<p>Erro ao carregar a página.</p>';
        }
    },

    // Lida com cliques nos links <a> da página.
    handleLinkClick(event) {
        event.preventDefault();
        const path = event.target.getAttribute('href');
        this.navigate(path);
    },
    
    // Ponto de entrada do roteador.
    init() {
        // Ouve os botões "voltar/avançar" do navegador.
        window.addEventListener('popstate', e => {
            const path = e.state ? e.state.path : (this.repoName + '/');
            this.resolve(path);
        });
        
        // Resolve a rota inicial com base na URL atual.
        let initialPath = window.location.pathname;
        if (sessionStorage.redirect) {
            initialPath = new URL(sessionStorage.redirect).pathname;
            sessionStorage.removeItem('redirect');
            history.replaceState({ path: initialPath }, '', initialPath);
        }
        this.resolve(initialPath);
    },

    // Funções privadas auxiliares.
    _getCleanPath(path) {
        let cleanPath = path.startsWith(this.repoName) ? path.substring(this.repoName.length) : path;
        return (cleanPath === '' || cleanPath === '/') ? '/login' : cleanPath;
    },

    async _loadView(path) {
        const response = await fetch(`views${path}.html`);
        if (!response.ok) throw new Error(`View não encontrada: ${path}`);
        return response.text();
    }
};

window.router = router;
