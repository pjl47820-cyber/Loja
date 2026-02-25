// ═══════════════════════════════════════════════════════════════════
// LOGIN.JS - SISTEMA DE AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════════════
// Este arquivo controla:
// - Verificação de senha
// - Login no painel administrativo
// - Redirecionamento após login
// ═══════════════════════════════════════════════════════════════════

// Senha correta para acessar o painel administrativo
const SENHA_CORRETA = "maosdefada2026";

/**
 * Verificar se já está logado ao carregar a página
 * Se já estiver logado, redireciona direto para o admin
 */
document.addEventListener('DOMContentLoaded', function() {
    const estaLogado = localStorage.getItem('adminLogado');
    
    if (estaLogado === 'true') {
        // Já está logado, vai direto para o admin
        window.location.href = 'admin.html';
    }
});

/**
 * Processar o formulário de login
 * Verifica a senha e faz o login
 */
document.getElementById('formLogin').addEventListener('submit', function(e) {
    e.preventDefault(); // Impede o envio padrão do formulário
    
    // Pega a senha digitada
    const senhaDigitada = document.getElementById('senha').value;
    const mensagemErro = document.getElementById('mensagemErro');
    
    // Verifica se a senha está correta
    if (senhaDigitada === SENHA_CORRETA) {
        // ========== SENHA CORRETA ==========
        
        // Salva o login no localStorage (fica salvo mesmo após fechar o navegador)
        localStorage.setItem('adminLogado', 'true');
        
        // Feedback visual no botão
        const btnEntrar = document.querySelector('.btn-entrar');
        btnEntrar.textContent = '✅ Acesso liberado!';
        btnEntrar.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        
        // Redireciona para o painel admin após 1 segundo
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
        
    } else {
        // ========== SENHA INCORRETA ==========
        
        // Mostra mensagem de erro
        mensagemErro.style.display = 'block';
        
        // Limpa o campo de senha
        document.getElementById('senha').value = '';
        document.getElementById('senha').focus();
        
        // Esconde a mensagem após 3 segundos
        setTimeout(() => {
            mensagemErro.style.display = 'none';
        }, 3000);
    }
});

/**
 * Limpar mensagem de erro ao digitar
 * Remove a mensagem de erro quando o usuário começa a digitar novamente
 */
document.getElementById('senha').addEventListener('input', function() {
    document.getElementById('mensagemErro').style.display = 'none';
});

/**
 * Alternar visibilidade da senha
 * Mostra ou esconde a senha digitada
 */
function toggleSenha() {
    const inputSenha = document.getElementById('senha');
    const btnToggle = document.querySelector('.btn-toggle-senha');
    
    if (inputSenha.type === 'password') {
        // Mostra a senha
        inputSenha.type = 'text';
        btnToggle.textContent = '🙈';
        btnToggle.title = 'Esconder senha';
    } else {
        // Esconde a senha
        inputSenha.type = 'password';
        btnToggle.textContent = '👁️';
        btnToggle.title = 'Mostrar senha';
    }
}
