// assets/js/app.js
const app = {
    // !!! IMPORTANTE: Substitua pela URL do seu App Script publicado !!!
    apiBaseUrl: 'https://script.google.com/macros/s/SUA_ID_DA_IMPLANTACAO/exec',
    
    // Estado da aplicação
    state: {
        user: null,
        token: localStorage.getItem('mafagafo_token')
    },

    // Ponto de entrada
    init() {
        this.setupRouter();
        this.checkAuth();
    },

    // Configura as rotas
    setupRouter() {
        router.add('/login', 'views/login.html');
        router.add('/register', 'views/register.html');
        router.add('/dashboard', 'views/dashboard.html');
        router.init();
    },

    // Verifica se o usuário está autenticado
    async checkAuth() {
        if (this.state.token) {
            const result = await this.apiRequest('GET', { action: 'verifyToken', token: this.state.token });
            if (result.success) {
                this.state.user = result.user;
                if (window.location.pathname !== '/dashboard') {
                    history.pushState({ path: '/dashboard' }, '', '/dashboard');
                    router.resolve('/dashboard');
                }
            } else {
                this.logout(); // Token inválido ou expirado
            }
        } else {
             if (window.location.pathname === '/dashboard') {
                 this.logout(); // Protege a rota do dashboard
             }
        }
    },

    // Inicializa a lógica específica de cada página
    initPage(path) {
        if (path === '/login') this.initLoginPage();
        if (path === '/register') this.initRegisterPage();
        if (path === '/dashboard') this.initDashboardPage();
    },

    // Lógica da Página de Login
    initLoginPage() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.email.value;
            const password = form.password.value;
            const passwordHash = CryptoJS.SHA256(password).toString();

            this.toggleLoader(true, 'login-button');
            const result = await this.apiRequest('POST', { action: 'login', email, senha_hash: passwordHash });
            this.toggleLoader(false, 'login-button');

            if (result.success) {
                localStorage.setItem('mafagafo_token', result.token);
                this.state.token = result.token;
                this.state.user = (await this.apiRequest('GET', { action: 'verifyToken', token: result.token })).user;
                history.pushState({ path: '/dashboard' }, '', '/dashboard');
                router.resolve('/dashboard');
            } else {
                this.displayError(result.message || 'Falha no login.');
            }
        });
    },

    // Lógica da Página de Cadastro
    initRegisterPage() {
        const form = document.getElementById('register-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = form.name.value;
            const email = form.email.value;
            const password = form.password.value;
            const passwordHash = CryptoJS.SHA256(password).toString();

            this.toggleLoader(true, 'register-button');
            const result = await this.apiRequest('POST', { action: 'register', nome, email, senha_hash: passwordHash });
            this.toggleLoader(false, 'register-button');

            if (result.success) {
                alert('Cadastro realizado com sucesso! Faça o login.');
                history.pushState({ path: '/login' }, '', '/login');
                router.resolve('/login');
            } else {
                this.displayError(result.message || 'Falha no cadastro.');
            }
        });
    },

    // Lógica da Página do Dashboard
    initDashboardPage() {
        if (!this.state.user) {
            this.logout();
            return;
        }
        document.getElementById('user-name').textContent = this.state.user.nome;
        document.getElementById('user-role').textContent = this.state.user.role;
        
        if (this.state.user.role === 'admin') {
            document.getElementById('admin-content').style.display = 'block';
        }

        document.getElementById('logout-button').addEventListener('click', () => this.logout());
    },

    // Função de Logout
    async logout() {
        if(this.state.token) {
            await this.apiRequest('POST', { action: 'logout', token: this.state.token });
        }
        localStorage.removeItem('mafagafo_token');
        this.state.token = null;
        this.state.user = null;
        history.pushState({ path: '/login' }, '', '/login');
        router.resolve('/login');
    },

    // Função genérica para fazer requisições à API
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
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
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
    
    // Exibe mensagem de erro nos formulários
    displayError(message) {
        const errorElement = document.getElementById('error-message');
        if(errorElement) {
            errorElement.textContent = message;
        }
    },

    // Controla a exibição do loader nos botões
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

window.app = app;
app.init();
