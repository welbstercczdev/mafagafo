// assets/js/app.js (VERSÃO FINAL E CORRETA)
const app = {
    // Confirme se esta é a sua URL mais recente do deploy do Apps Script
    apiBaseUrl: 'https://script.google.com/macros/s/AKfycbxAHYiMkLBiO_rPcjFbVoJazEvFattfVMIaWjBP8csZ5mv1Hk88t4MzWcq5jv8wKnagLg/exec',
    state: { user: null, token: localStorage.getItem('mafagafo_token') },

    // Ponto de entrada principal
    init() {
        // 1. Descobre se o usuário está logado
        this.checkAuthStatus().then(() => {
            // 2. SÓ DEPOIS, inicializa o roteador.
            router.init();
        });
    },

    // Apenas verifica o token e atualiza o estado interno. Não navega.
    async checkAuthStatus() {
        if (this.state.token) {
            const result = await this.apiRequest('GET', { action: 'verifyToken', token: this.state.token });
            if (result.success) {
                this.state.user = result.user;
            } else {
                localStorage.removeItem('mafagafo_token');
                this.state.token = null;
                this.state.user = null;
            }
        }
    },

    // Esta função agora SÓ adiciona os eventos à página que o ROTEADOR já mostrou.
    initPage(path) {
        if (path === '/login') this.initLoginPage();
        if (path === '/register') this.initRegisterPage();
        if (path === '/dashboard') this.initDashboardPage();
    },

    initLoginPage() {
        const form = document.getElementById('login-form');
        if(!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (lógica interna do login)
            this.displayError('');
            const email = form.email.value.toLowerCase().trim();
            const password = form.password.value;
            const passwordHash = CryptoJS.SHA256(password).toString();
            this.toggleLoader(true, 'login-button');
            const result = await this.apiRequest('POST', { action: 'login', email, senha_hash: passwordHash });
            this.toggleLoader(false, 'login-button');

            if (result.success) {
                localStorage.setItem('mafagafo_token', result.token);
                this.state.token = result.token;
                this.state.user = (await this.apiRequest('GET', { action: 'verifyToken', token: result.token })).user;
                // APENAS chama o resolve para o roteador redesenhar a tela.
                router.resolve('/dashboard');
            } else {
                this.displayError(result.message || 'Falha no login.');
            }
        });
    },

    initRegisterPage() {
        const form = document.getElementById('register-form');
        if(!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (lógica interna do registro)
            this.displayError('');
            const nome = form.name.value;
            const email = form.email.value.toLowerCase().trim();
            const password = form.password.value;
            const passwordHash = CryptoJS.SHA256(password).toString();
            this.toggleLoader(true, 'register-button');
            const result = await this.apiRequest('POST', { action: 'register', nome, email, senha_hash: passwordHash });
            this.toggleLoader(false, 'register-button');

            if (result.success) {
                alert('Cadastro realizado com sucesso! Você será redirecionado para a tela de login.');
                // APENAS chama o resolve.
                router.resolve('/login');
            } else {
                this.displayError(result.message || 'Não foi possível realizar o cadastro.');
            }
        });
    },

    initDashboardPage() {
        if (!this.state.user) return; // Segurança
        document.getElementById('user-name').textContent = this.state.user.nome;
        document.getElementById('user-role').textContent = this.state.user.role;
        if (this.state.user.role === 'admin') {
            document.getElementById('admin-content').style.display = 'block';
        }
        document.getElementById('logout-button').addEventListener('click', () => this.logout());
    },

    async logout() {
        if(this.state.token) { await this.apiRequest('POST', { action: 'logout', token: this.state.token }); }
        localStorage.removeItem('mafagafo_token');
        this.state.token = null;
        this.state.user = null;
        router.resolve('/login'); // Chama o resolve para ir para a tela de login.
    },
    
    // As funções abaixo não mudaram
    async apiRequest(method, params) { /* ...código idêntico... */ },
    displayError(message) { /* ...código idêntico... */ },
    toggleLoader(show, buttonId) { /* ...código idêntico... */ }
};

// Cole aqui as funções que não mudaram para ter o arquivo completo
app.apiRequest = async function(method, params) {
    try {
        let response;
        if (method === 'GET') {
            const query = new URLSearchParams(params).toString();
            response = await fetch(`${this.apiBaseUrl}?${query}`);
        } else {
            response = await fetch(this.apiBaseUrl, {
                method: 'POST', mode: 'cors', redirect: 'follow',
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
};
app.displayError = function(message) {
    const errorElement = document.getElementById('error-message');
    if(errorElement) { errorElement.textContent = message; }
};
app.toggleLoader = function(show, buttonId) {
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
};

window.app = app;
app.init();
