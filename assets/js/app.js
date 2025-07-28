// assets/js/app.js (VERSÃO FINAL E CORRETA)
const app = {
    apiBaseUrl: 'https://script.google.com/macros/s/AKfycbxAHYiMkLBiO_rPcjFbVoJazEvFattfVMIaWjBP8csZ5mv1Hk88t4MzWcq5jv8wKnagLg/exec',
    state: { user: null, token: localStorage.getItem('mafagafo_token') },

    init() {
        this.checkAuthAndRoute();
    },

    async checkAuthAndRoute() {
        if (this.state.token) {
            const result = await this.apiRequest('GET', { action: 'verifyToken', token: this.state.token });
            if (result.success) {
                this.state.user = result.user;
            } else {
                localStorage.removeItem('mafagafo_token');
                this.state.token = null;
            }
        }
        router.init(); // Inicia o roteador DEPOIS de saber o status de login.
    },

    // Esta função agora só adiciona eventos, ela não navega mais.
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
            this.displayError('');
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
                // Apenas chama o resolve, sem mudar a URL aqui.
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
                router.resolve('/login');
            } else {
                this.displayError(result.message || 'Não foi possível realizar o cadastro.');
            }
        });
    },

    initDashboardPage() {
        if (!this.state.user) return; // Segurança extra
        document.getElementById('user-name').textContent = this.state.user.nome;
        document.getElementById('user-role').textContent = this.state.user.role;
        if (this.state.user.role === 'admin') {
            const adminContent = document.getElementById('admin-content');
            if (adminContent) adminContent.style.display = 'block';
        }
        document.getElementById('logout-button').addEventListener('click', () => this.logout());
    },

    async logout() {
        if(this.state.token) { await this.apiRequest('POST', { action: 'logout', token: this.state.token }); }
        localStorage.removeItem('mafagafo_token');
        this.state.token = null;
        this.state.user = null;
        router.resolve('/login');
    },

    async apiRequest(method, params) {
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
    },

    displayError(message) {
        const errorElement = document.getElementById('error-message');
        if(errorElement) { errorElement.textContent = message; }
    },

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
