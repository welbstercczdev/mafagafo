// assets/js/router.js (VERSÃO FINAL)
const router = {
    appElement: document.getElementById('app'),
    // Define o nome do repositório para construir os caminhos corretamente.
    repoName: '/mafagafo',

    // Limpa o caminho da URL, removendo o nome do repositório.
    // Ex: transforma "/mafagafo/login" em "/login".
    getCleanPath(path) {
        if (path.startsWith(this.repoName)) {
            let cleanPath = path.substring(this.repoName.length);
            // Se o caminho for a raiz do projeto (ex: "/mafagafo/"), define como "/login".
            return cleanPath || '/login';
        }
        return path === '/' ? '/login' : path;
    },

    // Carrega o conteúdo HTML de uma view.
    async loadView(path) {
        try {
            // A tag <base> no index.html garante que 'views/...' seja encontrado corretamente.
            const response = await fetch(`views${path}.html`);
            if (!response.ok) throw new Error("View não encontrada");
            return await response.text();
        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            // Em caso de erro, carrega a view de login como fallback.
            return await (await fetch('views/login.html')).text();
        }
    },

    // Resolve uma rota: encontra a view, carrega e inicializa a página.
    async resolve(path) {
        const cleanPath = this.getCleanPath(path);
        
        // Exibe um loader enquanto a view está sendo carregada.
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>';
        
        const html = await this.loadView(cleanPath);
        this.appElement.innerHTML = html;
        // Chama a função do app.js para adicionar os event listeners da página carregada.
        window.app.initPage(cleanPath);
    },

    // Lida com cliques em links da SPA.
    handle(event) {
        event.preventDefault();
        const relativePath = event.target.getAttribute('href'); // ex: "/login"
        const fullPath = this.repoName + relativePath; // ex: "/mafagafo/login"
        history.pushState({ path: fullPath }, '', fullPath);
        this.resolve(fullPath);
    },

    // Ponto de entrada do roteador.
    init() {
        let path;
        // Verifica se veio de um redirecionamento do 404.html.
        if (sessionStorage.redirect) {
            path = new URL(sessionStorage.redirect).pathname;
            sessionStorage.removeItem('redirect');
            history.replaceState({ path: path }, '', path);
        } else {
            path = window.location.pathname;
        }

        // Lida com o carregamento inicial da página.
        this.resolve(path);

        // Ouve o evento de "voltar" do navegador.
        window.addEventListener('popstate', event => {
            const newPath = event.state ? event.state.path : (this.repoName + '/');
            this.resolve(newPath);
        });
    }
};

window.router = router;
