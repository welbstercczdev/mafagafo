// assets/js/router.js (VERSÃO FINAL CORRIGIDA)
const router = {
    appElement: document.getElementById('app'),
    repoName: '/mafagafo', // Nome do repositório para construir os caminhos corretamente.

    // Transforma um caminho completo (ex: "/mafagafo/login") em um caminho limpo (ex: "/login").
    // Crucialmente, agora entende que a raiz do projeto deve levar ao login.
    getCleanPath(path) {
        if (path.startsWith(this.repoName)) {
            let cleanPath = path.substring(this.repoName.length);
            // Se o resultado for uma string vazia ou apenas "/", é a raiz do projeto.
            // Neste caso, definimos o caminho como "/login". ESTA É A CORREÇÃO PRINCIPAL.
            if (cleanPath === '' || cleanPath === '/') {
                return '/login';
            }
            return cleanPath;
        }
        // Fallback para caso o caminho já venha limpo.
        return path === '/' ? '/login' : path;
    },

    // Carrega o conteúdo HTML de uma view a partir da pasta /views.
    async loadView(path) {
        try {
            // A tag <base> no index.html garante que o caminho seja resolvido corretamente.
            const response = await fetch(`views${path}.html`);
            if (!response.ok) throw new Error(`View não encontrada em views${path}.html`);
            return await response.text();
        } catch (error) {
            console.error('Erro ao carregar a view:', error);
            // Em caso de qualquer erro, carrega a view de login como fallback de segurança.
            return await (await fetch('views/login.html')).text();
        }
    },

    // Resolve uma rota: encontra a view, carrega seu HTML e inicializa a página.
    async resolve(path) {
        const cleanPath = this.getCleanPath(path);
        
        // Exibe um loader visual para o usuário.
        this.appElement.innerHTML = '<div class="auth-container"><div class="auth-card" style="text-align:center;"><div class="loader" style="border-color: #ccc; border-top-color: var(--primary-color);"></div></div></div>';
        
        const html = await this.loadView(cleanPath);
        this.appElement.innerHTML = html;
        
        // Chama a função do app.js para adicionar os eventos da página carregada.
        window.app.initPage(cleanPath);
    },

    // Lida com cliques em links internos da SPA (Single-Page Application).
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
            history.replaceState({ path }, '', path);
        } else {
            path = window.location.pathname;
        }

        // Carrega a view correspondente ao caminho inicial.
        this.resolve(path);

        // Ouve o evento de "voltar/avançar" do navegador para navegar no histórico.
        window.addEventListener('popstate', event => {
            // Se o estado for nulo (raro), volta para a raiz do projeto.
            const newPath = event.state ? event.state.path : this.repoName + '/';
            this.resolve(newPath);
        });
    }
};

window.router = router;
