// mafagafo-sdk.js - O SDK para ser usado em outras aplicações!
const mafagafo = (function() {
    let _config = null;

    // Função interna para chamadas de API
    async function _apiRequest(body) {
        if (!_config) throw new Error("Mafagafo não foi inicializado. Chame mafagafo.initializeApp(config) primeiro.");
        try {
            const response = await fetch(_config.apiBaseUrl, {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result;
        } catch (error) {
            console.error("Erro na API Mafagafo:", error);
            throw error;
        }
    }

    // Objeto que será retornado pelo SDK
    return {
        // Inicializa o SDK com a configuração do projeto
        initializeApp: function(config) {
            if (!config || !config.apiKey || !config.apiBaseUrl) {
                throw new Error("Configuração inválida. É necessário apiKey e apiBaseUrl.");
            }
            _config = config;
            console.log("SDK Mafagafo inicializado.");
        },

        // Retorna o objeto de autenticação com os métodos
        auth: function() {
            if (!_config) throw new Error("Mafagafo não foi inicializado.");
            return {
                /**
                 * Cria um novo usuário com email e senha.
                 * @param {string} email O email do usuário.
                 * @param {string} password A senha do usuário.
                 * @param {string} [nome] O nome do usuário (opcional).
                 * @returns {Promise<object>}
                 */
                createUserWithEmailAndPassword: async function(email, password, nome = '') {
                    const passwordHash = CryptoJS.SHA256(password).toString();
                    return _apiRequest({
                        action: 'register',
                        apiKey: _config.apiKey,
                        email,
                        senha_hash: passwordHash,
                        nome
                    });
                },

                /**
                 * Autentica um usuário com email e senha.
                 * @param {string} email O email do usuário.
                 * @param {string} password A senha do usuário.
                 * @returns {Promise<object>} Contém o token de sessão em caso de sucesso.
                 */
                signInWithEmailAndPassword: async function(email, password) {
                    const passwordHash = CryptoJS.SHA256(password).toString();
                    return _apiRequest({
                        action: 'login',
                        apiKey: _config.apiKey,
                        email,
                        senha_hash: passwordHash
                    });
                },
                
                /**
                 * Desconecta um usuário.
                 * @param {string} token O token de sessão do usuário.
                 * @returns {Promise<object>}
                 */
                signOut: async function(token) {
                    return _apiRequest({
                        action: 'logout',
                        token
                    });
                }
            };
        }
    };
})();```

---

### **Fase 4: Como Usar o Novo SDK em Outra Aplicação**

Agora, imagine que você criou um "Blog Pessoal". No seu `blog.html`, o uso ficaria incrivelmente limpo, exatamente como o Firebase.

1.  **Crie seu projeto** no seu Console Mafagafo e copie a `apiKey` gerada.
2.  No seu `blog.html`, inclua os scripts e use o SDK:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meu Blog</title>
</head>
<body>
    <h3>Cadastre-se no Blog</h3>
    <input type="email" id="email" placeholder="Email">
    <input type="password" id="password" placeholder="Senha">
    <button onclick="cadastrarNoBlog()">Cadastrar</button>

    <!-- Hashing -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
    
    <!-- SDK do Mafagafo -->
    <script src="caminho/para/seu/mafagafo-sdk.js"></script>

    <script>
        // 1. Objeto de configuração do Mafagafo para o Blog
        const mafagafoConfig = {
            apiKey: "MF-live-...", // A chave que você copiou do seu Console
            apiBaseUrl: "https://script.google.com/macros/s/..." // A URL da sua API
        };

        // 2. Inicialize o Mafagafo
        mafagafo.initializeApp(mafagafoConfig);

        // 3. Crie a função de cadastro usando o SDK
        async function cadastrarNoBlog() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const resultado = await mafagafo.auth().createUserWithEmailAndPassword(email, password);
                alert("Cadastro no blog realizado com sucesso!");
                console.log(resultado);
            } catch (error) {
                alert("Erro: " + error.message);
            }
        }
    </script>
</body>
</html>
