const app = {
    // !! URL DA SUA API - CORRETA E INSERIDA !!
    apiBaseUrl: 'https://script.google.com/macros/s/AKfycbxAHYiMkLBiO_rPcjFbVoJazEvFattfVMIaWjBP8csZ5mv1Hk88t4MzWcq5jv8wKnagLg/exec',
    
    // Armazena o estado da aplicação (usuário logado, token).
    state: {
        user: null,
        token: localStorage.getItem('mafagafo_token')
    },

    // Ponto de entrada da aplicação.
    init() {
        this.checkAuthAndRoute();
    },

    // Verifica se existe um token, valida-o e depois inicializa o roteador.
    // Isso garante que sabemos o status de login ANTES de decidir qual página mostrar.
    async checkAuthAndRoute() {
        if (this.state.token) {
            const result = await this.apiRequest('GET', { action: 'verifyToken', token: this.state.token });
            if (result.success) {
                this.state.user = result.user;
            } else {
                // Se o token for inválido (expirado, etc.), limpa o estado.
                this.state.token = null;
                localStorage.removeItem('mafagafo_token');
            }
        }
        // Agora que o estado de autenticação está definido, o roteador pode começar.
        router.init();
    },

    // Chamado pelo roteador depois que uma nova view é carregada no DOM.
    initPage(path) {
        // Lógica de proteção de rotas.
        if (path === '/dashboard' && !this.state.user) {
            return this.logout(); // Se não estiver logado, não pode acessar o dashboard.
        }
        if ((path === '/login' || path === '/register') && this.state.user) {
            // Se já estiver logado, redireciona para o dashboard.
            history.replaceState({ path: router.repoName + '/dashboard' }, '', router.repoName + '/dashboard');
            return router.resolve(router.repoName + '/dashboard');
        }

        // Adiciona os eventos específicos da página que acabou de ser carregada.
        if (path === '/login') this.initLoginPage();
        if (path === '/register') this.initRegisterPage();
        if (path === '/dashboard') this.initDashboardPage();
    },

    // Adiciona o evento de submit ao formulário de login.
    initLoginPage() {
        const form = document.getElementById('login-form');
        if(!form) return; // Segurança caso o elemento não exista.
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.displayError(''); // Limpa mensagens de erro antigas.
            const email = form.email.value;
            const password = form.password.value;
            const passwordHash = CryptoJS.SHA256(password).toString();

            this.toggleLoader(true, 'login-button');
            const result = await this.apiRequest('POST', { action: 'login', email, senha_hash: passwordHash });
            this.toggleLoader(false, 'login-button');

            if (result.success) {
                localStorage.setItem('mafagafo_token', result.token);
                this.state.token = result.token;
                // Valida o token e recarrega a aplicação no estado "logado".
                await this.checkAuthAndRoute(); 
            } else {
                this.displayError(result.message || 'Falha no login. Verifique suas credenciais.');
            }
        });
    },

    // Adiciona o evento de submit ao formulário de registro.
    initRegisterPage() {
        const form = document.getElementById('register-form');
        if(!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.displayError('');
            const nome = form.name.value;
            const email = form.email.value;
            const password = form.password.value;
            const passwordHash = CryptoJS.SHA256(password).toString();

            this.toggleLoader(true, 'register-button');
            const result = await this.apiRequest('POST', { action: 'register', nome, email, senha_hash: passwordHash });
            this.toggleLoader(false, 'register-button');

            if (result.success) {
                alert('Cadastro realizado com sucesso! Você será redirecionado para a tela de login.');
                // Navega para a página de login usando o roteador.
                history.pushState({ path: router.repoName + '/login' }, '', router.repoName + '/login');
                router.resolve(router.repoName + '/login');
            } else {
                this.displayError(result.message || 'Não foi possível realizar o cadastro.');
            }
        });
    },

    // Preenche os dados do usuário no dashboard e adiciona evento de logout.
    initDashboardPage() {
        if (!this.state.user) return this.logout();
        
        document.getElementById('user-name').textContent = this.state.user.nome;
        document.getElementById('user-role').textContent = this.state.user.role;
        
        // Mostra conteúdo exclusivo para admin.
        if (this.state.user.role === 'admin') {
            const adminContent = document.getElementById('admin-content');
            if (adminContent) adminContent.style.display = 'block';
        }

        document.getElementById('logout-button').addEventListener('click', () => this.logout());
    },

    // Limpa o estado de login e redireciona para a página de login.
    async logout() {
        if(this.state.token) {
            // Informa a API que o token não deve mais ser válido (opcional, mas boa prática).
            await this.apiRequest('POST', { action: 'logout', token: this.state.token });
        }
        localStorage.removeItem('mafagafo_token');
        this.state.token = null;
        this.state.user = null;
        history.pushState({ path: router.repoName + '/login' }, '', router.repoName + '/login');
        router.resolve(router.repoName + '/login');
    },

    // Função central para fazer requisições à API do Google Apps Script.
    async apiRequest(method, params) {
        try {
            let response;
            if (method === 'GET') {
                const query = new URLSearchParams(params).toString();
                response = await fetch(`${this.apiBaseUrl}?${query}`);
            } else { // POST
                response = await fetch(this.apiBaseUrl, {
                    method: 'POST',
                    mode: 'cors',
                    redirect: 'follow',
                    body: JSON.stringify(params),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' } // Necessário para o Apps Script
                });
            }
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            this.displayError('Erro de comunicação com o servidor.');
            return { success: false, message: 'Erro de comunicação.' };
        }
    },

    // Mostra mensagens de erro nos formulários.
    displayError(message) {
        const errorElement = document.getElementById('error-message');
        if(errorElement) {
            errorElement.textContent = message;
        }
    },

    // Controla o estado de carregamento dos botões.
    toggleLoader(show, buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.loader');
        
        if (show) {
            button.disabled = true;
            text.style.display = 'none';
            loader.style.display = 'block';
        } else {
            button.disabled = false;
            text.style.display = 'inline';
            loader.style.display = 'none';
        }
    }
};

// Inicializa a aplicação.
window.app = app;
app.init();
