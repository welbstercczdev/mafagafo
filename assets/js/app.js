// assets/js/app.js (VERSÃO PLATAFORMA - CÓDIGO COMPLETO)
const app = {
    // URL da sua API. Já está correta.
    apiBaseUrl: 'https://script.google.com/macros/s/AKfycbxAHYiMkLBiO_rPcjFbVoJazEvFattfVMIaWjBP8csZ5mv1Hk88t4MzWcq5jv8wKnagLg/exec',
    state: { user: null, token: null, projects: [] },

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
            const result = await this.apiRequest({ action: 'verifyToken', token: this.state.token });
            this.state.user = result.success ? result.user : null;
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

    async initDashboardPage() {
        if (!this.state.user) return;
        document.getElementById('user-name').textContent = this.state.user.nome;
        document.getElementById('logout-button').addEventListener('click', this.logout.bind(this));
        
        const createForm = document.getElementById('create-project-form');
        if (createForm) createForm.addEventListener('submit', this.handleCreateProject.bind(this));

        await this.loadAndRenderProjects();
    },

    // Funções de Lógica de Negócio do Console
    async handleCreateProject(e) {
        e.preventDefault();
        const projectName = e.target['project-name'].value;
        this.toggleLoader(true, 'create-project-button');
        const result = await this.apiRequest({
            action: 'createProject',
            token: this.state.token,
            projectName: projectName
        });
        this.toggleLoader(false, 'create-project-button');
        
        if (result.success) {
            alert(`Projeto "${result.project.projectName}" criado com sucesso!`);
            e.target.reset();
            await this.loadAndRenderProjects();
        } else {
            document.getElementById('project-error-message').textContent = result.message;
        }
    },
    
    async loadAndRenderProjects() {
        const listContainer = document.getElementById('projects-list');
        listContainer.innerHTML = "<p>Carregando projetos...</p>";

        const result = await this.apiRequest({ action: 'getProjects', token: this.state.token });
        if (result.success && result.projects) {
            this.state.projects = result.projects;
            if (result.projects.length === 0) {
                listContainer.innerHTML = "<p>Você ainda não criou nenhum projeto.</p>";
                return;
            }

            let html = '<ul style="list-style-type: none; padding: 0;">';
            result.projects.forEach(p => {
                html += `
                    <li style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                        <strong style="font-size: 1.2em;">${p.projectName}</strong><br>
                        <small><strong>Project ID:</strong> ${p.projectId}</small><br>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 0.5rem;">
                            <small><strong>API Key:</strong></small>
                            <code style="background-color: #f4f4f4; padding: 0.2rem 0.5rem; border-radius: 4px;">${p.apiKey}</code>
                            <button onclick="app.copyToClipboard('${p.apiKey}')" style="padding: 0.2rem 0.6rem; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #f0f0f0;">Copiar</button>
                        </div>
                    </li>
                `;
            });
            html += '</ul>';
            listContainer.innerHTML = html;
        } else {
            listContainer.innerHTML = `<p style="color: red;">${result.message || 'Erro ao carregar projetos.'}</p>`;
        }
    },
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('API Key copiada para a área de transferência!');
        }, (err) => {
            alert('Falha ao copiar a chave.');
            console.error('Erro ao copiar: ', err);
        });
    },

    // Funções de usuário para o Console Mafagafo
    async handleLogin(e) {
        e.preventDefault();
        this.displayError('');
        // Para logar no console, usamos um projectId especial "console" que o backend não precisa validar com apiKey
        const email = e.target.email.value.toLowerCase().trim();
        const password = e.target.password.value;
        const passwordHash = CryptoJS.SHA256(password).toString();
        this.toggleLoader(true, 'login-button');
        const result = await this.apiRequest({ action: 'login', projectId: 'console-internal', email, senha_hash: passwordHash });
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
        // Para registrar no console, também usamos o projectId "console"
        const result = await this.apiRequest({ action: 'register', projectId: 'console-internal', nome, email, senha_hash: passwordHash });
        this.toggleLoader(false, 'register-button');
        if (result.success) {
            alert('Cadastro realizado com sucesso!');
            router.navigate('/login');
        } else {
            this.displayError(result.message || 'Não foi possível cadastrar.');
        }
    },

    async logout() {
        if (this.state.token) { await this.apiRequest({ action: 'logout', token: this.state.token }); }
        localStorage.removeItem('mafagafo_token');
        this.state.user = null;
        this.state.token = null;
        router.navigate('/login');
    },

    // =======================================================
    // FUNÇÕES UTILITÁRIAS (COMPLETAS)
    // =======================================================

    async apiRequest(params) {
        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                body: JSON.stringify(params),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try { const err = await response.json(); errorMsg = err.message || errorMsg; } catch (e) { /* Resposta não foi JSON, usa a mensagem padrão */ }
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
        const errorElement = document.getElementById('error-message') || document.getElementById('project-error-message');
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
