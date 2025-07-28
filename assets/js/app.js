// assets/js/app.js (ARQUITETURA FINAL - CÓDIGO 100% COMPLETO)
const app = {
    // Confirme se esta é a sua URL mais recente do deploy do Apps Script
    apiBaseUrl: 'https://script.google.com/macros/s/AKfycbxAHYiMkLBiO_rPcjFbVoJazEvFattfVMIaWjBP8csZ5mv1Hk88t4MzWcq5jv8wKnagLg/exec',
    state: { user: null, token: null },

    // Ponto de entrada principal da aplicação
    init() {
        // 1. Descobre se o usuário está logado
        this.checkAuthStatus().then(() => {
            // 2. SÓ DEPOIS de saber o status, o roteador é iniciado.
            router.init();
        });
    },

    // Apenas verifica o token e atualiza o estado interno. NÃO NAVEGA.
    async checkAuthStatus() {
        this.state.token = localStorage.getItem('mafagafo_token');
        if (this.state.token) {
            const result = await this.apiRequest('GET', { action: 'verifyToken', token: this.state.token });
            this.state.user = result.success ? result.user : null;
            if (!result.success) {
                localStorage.removeItem('mafagafo_token');
                this.state.token = null;
            }
        } else {
            this.state.user = null;
        }
    },

    // Esta função agora SÓ adiciona os eventos à página que o ROTEADOR já mostrou.
    initPage(path) {
        if (path === '/login') this.initLoginPage();
        if (path === '/register') this.initRegisterPage();
        if (path === '/dashboard') this.initDashboardPage();
    },

    // Funções de inicialização de página agora são bem simples
    initLoginPage() {
        const form = document.getElementById('login-form');
        if (form) form.addEventListener('submit', this.handleLogin.bind(this));
    },

    initRegisterPage() {
        const form = document.getElementById('register-form');
        if (form) form.addEventListener('submit', this.handleRegister.bind(this));
    },

    initDashboardPage() {
        if (!this.state.user) return;
        document.getElementById('user-name').textContent = this.state.user.nome;
        document.getElementById('user-role').textContent = this.state.user.role;
        if (this.state.user.role === 'admin') {
            document.getElementById('admin-content').style.display = 'block';
        }
        document.getElementById('logout-button').addEventListener('click', this.logout.bind(this));
    },

    // Funções de Lógica de Negócio (separadas para clareza)
    async handleLogin(e) {
        e.preventDefault();
        this.displayError('');
        const email = e.target.email.value.toLowerCase().trim();
        const password = e.target.password.value;
        const passwordHash = CryptoJS.SHA256(password).toString();
        this.toggleLoader(true, 'login-button');
        const result = await this.apiRequest('POST', { action: 'login', email, senha_hash: passwordHash });
        this.toggleLoader(false, 'login-button');
        if (result.success) {
            localStorage.setItem('mafagafo_token', result.token);
            await this.checkAuthStatus();
            router.navigate('/dashboard');
        } else {
            this.displayError(result.message || 'Falha no login.');
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        this.displayError('');
        const nome = e.target.name.value;
        const email = e.target.email.value.toLowerCase().trim();
        const password = e.target.password.value;
        const passwordHash = CryptoJS.SHA256(password).toString();
        this.toggleLoader(true, 'register-button');
        const result = await this.apiRequest('POST', { action: 'register', nome, email, senha_hash: passwordHash });
        this.toggleLoader(false, 'register-button');
        if (result.success) {
            alert('Cadastro realizado com sucesso!');
            router.navigate('/login');
        } else {
            this.displayError(result.message || 'Não foi possível cadastrar.');
        }
    },

    async logout() {
        if (this.state.token) { await this.apiRequest('POST', { action: 'logout', token: this.state.token }); }
        localStorage.removeItem('mafagafo_token');
        this.state.user = null;
        this.state.token = null;
        router.navigate('/login');
    },

    // =======================================================
    // FUNÇÕES UTILITÁRIAS (COMPLETAS E INCLUÍDAS)
    // =======================================================

    async apiRequest(method, params) {
        try {
            let response;
            if (method === 'GET') {
                const query = new URLSearchParams(params).toString();
                response = await fetch(`${this.apiBaseUrl}?${query}`);
            } else {
                response = await fetch(this.apiBaseUrl, {
                    method: 'POST',
                    mode: 'cors',
                    redirect: 'follow',
                    body: JSON.stringify(params),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                });
            }
            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const err = await response.json();
                    errorMsg = err.message || errorMsg;
                } catch (e) {
                    // Resposta não foi JSON, usa a mensagem padrão
                }
                throw new Error(errorMsg);
            }
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            this.displayError(error.message || 'Erro de comunicação com o servidor.');
            return { success: false, message: error.message || 'Erro de comunicação.' };
        }
    },

    displayError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
        }
    },

    toggleLoader(show, buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.loader');
        if (show) {
            button.disabled = true;
            if (text) text.style.display = 'none';
            if (loader) loader.style.display = 'block';
        } else {
            button.disabled = false;
            if (text) text.style.display = 'inline';
            if (loader) loader.style.display = 'none';
        }
    }
};

window.app = app;
app.init();
