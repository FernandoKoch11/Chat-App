document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('button2');
    const loginBtn = document.getElementById('button1');
    const inputName = document.getElementById('Username');
    const inputPass = document.getElementById('Password');
    const sendBtn = document.getElementById('send');
    const messageInput = document.getElementById('messageInput');
    const chatView = document.getElementById('ChatView');

    //Função para visualizar sua senha
    const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const passwordField = document.getElementById('Password');
        const type = passwordField.type === 'password' ? 'text' : 'password';
        passwordField.type = type;
    });
}

if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const username = inputName.value;

        // Verifica se o nome de usuário não é vazio
        if (username.trim() === "" || username === "Username") {
            alert("Insert a valid username, please.");
            return;
        }

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: inputPass.value })
        });

        const result = await response.json();
        // Exibe a mensagem de sucesso ou erro
        alert(result.message); 
    });
}

    // Função para login do usuário
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: inputName.value, password: inputPass.value })
            });
            const result = await response.json();
            // Verifica se o login foi bem-sucedido
            if (result.message === "Login bem-sucedido!") {
                sessionStorage.setItem('isLoggedIn', 'true'); // Define que o usuário está logado
                sessionStorage.setItem('username', inputName.value); // Armazena o nome do usuário
                localStorage.setItem('username', inputName.value); // Salva o nome de usuário no localStorage
                alert(result.message);
                window.location.href = '/chat.html'; // Redireciona para o chat
            } else {
                alert("Incorrect username or password.");
            }
        });
    }

    // Configuração do WebSocket, executada somente após a página do chat carregar
    if (window.location.pathname === '/chat.html') {
        // Verifica se o usuário está logado; caso contrário, redireciona para a página de login
        if (sessionStorage.getItem('isLoggedIn') !== 'true') {
            alert('Por favor, faça login primeiro.');
            window.location.href = '/index.html'; // Página de login
        } else {
            const username = sessionStorage.getItem('username');
            const ws = new WebSocket('ws://localhost:3000');

            // Evento para quando a conexão WebSocket é aberta
            ws.addEventListener('open', () => {
                // Envia o nome de usuário para o servidor para identificação
                ws.send(JSON.stringify({ type: 'login', username }));
            });

            // Envia a mensagem ao servidor quando o botão de enviar é clicado
            sendBtn.addEventListener('click', () => {
                if (messageInput.value) {
                    const message = messageInput.value;
                    ws.send(JSON.stringify({ type: 'message', message }));
                    messageInput.value = ''; // Limpa o campo de entrada

                    // Exibe a mensagem no ChatView localmente
                    const messageElement = document.createElement('p');
                    messageElement.textContent = `${username}: ${message}`;
                    
                    chatView.scrollTop = chatView.scrollHeight; // Rola para a última mensagem
                }
            });

            // Exibe a mensagem no ChatView quando recebe uma nova mensagem do servidor
            ws.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                const messageElement = document.createElement('p');
                messageElement.textContent = `${data.username}: ${data.message}`;
                chatView.appendChild(messageElement);
                chatView.scrollTop = chatView.scrollHeight; // Rola para a última mensagem
            });
        }
    }
});