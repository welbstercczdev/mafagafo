// assets/js/app.js (VERSÃO PLATAFORMA)
const app = {
    // COLE A SUA NOVA URL DA API AQUI
    apiBaseUrl: 'https://script.google.com/macros/s/AKfycbxAHYiMkLBiO_rPcjFbVoJazEvFattfVMIaWjBP8csZ5mv1Hk88t4MzWcq5jv8wKnagLg/exec',
    state: { user: null, token: null, projects: [] },

    init() { this.checkAuthStatus().then(() => router.init()); },

    async checkAuthStatus() {
        this.state.token = localStorage.getItem('mafagafo_token');
        if (this.state.token) {
            const result = await this.apiRequest({ action: 'verifyToken', token: this.state.token });
            this.state.user = result.success ? result.user : null;
        } else {
            this.state.user = null;
        }
    },

    initPage(path) {
        if (path === '/login') this.initLoginPage();
        if (path === '/register') this.initRegisterPage();
        if (path === '/dashboard') this.initDashboardPage();
    },

    initLoginPage() { /* ...código idêntico... */ },
    initRegisterPage() { /* ...código idêntico... */ },

    async initDashboardPage() {
        if (!this.state.user) return;
        document.getElementById('user-name').textContent = this.state.user.nome;
        document.getElementById('logout-button').addEventListener('click', this.logout.bind(this));
        
        // Lógica para criar projeto
        const createForm = document.getElementById('create-project-form');
        if (createForm) createForm.addEventListener('submit', this.handleCreateProject.bind(this));

        // Carrega e renderiza os projetos do usuário
        await this.loadAndRenderProjects();
    },

    // Lógica de Negócio do Console
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
            e.target.reset(); // Limpa o formulário
            await this.loadAndRenderProjects(); // Recarrega a lista
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

            let html = '<ul>';
            result.projects.forEach(p => {
                html += `
                    <li style="border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <strong>${p.projectName}</strong><br>
                        <small><strong>Project ID:</strong> ${p.projectId}</small><br>
                        <small><strong>API Key:</strong> <code>${p.apiKey}</code></small>
                        <button onclick="app.copyToClipboard('${p.apiKey}')" style="margin-left: 10px; cursor: pointer;">Copiar</button>
                    </li>
                `;
            });
            html += '</ul>';
            listContainer.innerHTML = html;
        } else {
            listContainer.innerHTML = `<p style="color: red;">${result.message || 'Erro ao carregar projetos.'}</p>`;
        }
    },
    
    // Função utilitária para copiar a chave
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('API Key copiada para a área de transferência!');
        }, (err) => {
            alert('Falha ao copiar a chave.');
            console.error('Erro ao copiar: ', err);
        });
    },

    // Funções de usuário (sem grandes mudanças)
    async handleLogin(e) { /* ...código idêntico... */ },
    async handleRegister(e) { /* ...código idêntico... */ },
    async logout() { /* ...código idêntico... */ },
    async apiRequest(params) { /* ...agora só precisa de um argumento... */ },
    displayError(message) { /* ...código idêntico... */ },
    toggleLoader(show, buttonId) { /* ...código idêntico... */ }
};

// Cole aqui o código completo e atualizado das funções para facilitar
app.initLoginPage = function() {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', this.handleLogin.bind(this));
};
app.initRegisterPage = function() {
    const form = document.getElementById('register-form');
    if (form) form.addEventListener('submit', this.handleRegister.bind(this));
};
app.handleLogin = async function(e) {
    e.preventDefault();
    this.displayError('');
    // No Console Mafagafo, não precisamos de apiKey para o login
    const email = e.target.email.value.toLowerCase().trim();
    const password = e.target.password.value;
    const passwordHash = CryptoJS.SHA256(password).toString();
    this.toggleLoader(true, 'login-button');
    // Usamos um projectId especial "console" para os usuários do painel
    const result = await this.apiRequest({ action: 'login', apiKey: 'console-internal', email, senha_hash: passwordHash });
    this.toggleLoader(false, 'login-button');
    if (result.success) {
        localStorage.setItem('mafagafo_token', result.token);
        await this.checkAuthStatus();
        router.navigate('/dashboard');
    } else {
        this.displayError(result.message || 'Falha no login.');
    }
};
app.handleRegister = async function(e) {
    e.preventDefault();
    this.displayError('');
    const nome = e.target.name.value;
    const email = e.target.email.value.toLowerCase().trim();
    const password = e.target.password.value;
    const passwordHash = CryptoJS.SHA256(password).toString();
    this.toggleLoader(true, 'register-button');
    const result = await this.apiRequest({ action: 'register', apiKey: 'console-internal', nome, email, senha_hash: passwordHash });
    this.toggleLoader(false, 'register-button');
    if (result.success) {
        alert('Cadastro realizado com sucesso!');
        router.navigate('/login');
    } else {
        this.displayError(result.message || 'Não foi possível cadastrar.');
    }
};
app.logout = async function() {
    if (this.state.token) { await this.apiRequest({ action: 'logout', token: this.state.token }); }
    localStorage.removeItem('mafagafo_token');
    this.state.user = null;
    this.state.token = null;
    router.navigate('/login');
};
app.apiRequest = async function(params) {
    try {
        const response = await fetch(this.apiBaseUrl, {
            method: 'POST', mode: 'cors', redirect: 'follow',
            body: JSON.stringify(params), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errData.message);
        }
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        this.displayError(error.message);
        return { success: false, message: error.message };
    }
};
app.displayError = function(message) {
    const errorElement = document.getElementById('error-message') || document.getElementById('project-error-message');
    if (errorElement) { errorElement.textContent = message; }
};
app.toggleLoader = function(show, buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    const text = button.querySelector('.btn-text');
    const loader = button.querySelector('.loader');
    if (show) {
        button.disabled = true;
        if(text) text.style.display = 'none';
        if(loader) loader.style.display = 'block';
    } else {
        button.disabled = false;
        if(text) text.style.display = 'inline';
        if(loader) loader.style.display = 'none';
    }
};

window.app = app;
app.init();
