// ═══════════════════════════════════════════════════════════════════
// FIREBASE-CONFIG.JS - CONFIGURAÇÃO DO FIREBASE
// ═══════════════════════════════════════════════════════════════════
// Este arquivo contém:
// - Credenciais do projeto Firebase
// - Inicialização do Firebase
// - Configuração do Firestore (banco de dados)
// ═══════════════════════════════════════════════════════════════════

// ========== CREDENCIAIS DO FIREBASE ==========
// Estas informações conectam o site ao seu projeto no Firebase
// IMPORTANTE: Estas credenciais são públicas e podem ser expostas
// A segurança é garantida pelas regras do Firestore, não pelas credenciais
const firebaseConfig = {
    apiKey: "AIzaSyC3rTcMgdSXzKQ15cpIVCtoCgnnPDIecE8",           // Chave da API
    authDomain: "maos-de-fada-981ec.firebaseapp.com",            // Domínio de autenticação
    projectId: "maos-de-fada-981ec",                             // ID do projeto
    storageBucket: "maos-de-fada-981ec.firebasestorage.app",     // Bucket de armazenamento
    messagingSenderId: "874551018297",                           // ID do remetente de mensagens
    appId: "1:874551018297:web:ecfad964e4119965e65ee8"          // ID do aplicativo
};

// ========== INICIALIZAR FIREBASE ==========
// Conecta o site ao Firebase usando as credenciais acima
firebase.initializeApp(firebaseConfig);

// ========== INICIALIZAR FIRESTORE ==========
// Firestore é o banco de dados onde os produtos são salvos
const db = firebase.firestore();

// ========== LOGS DE CONFIRMAÇÃO ==========
// Mensagens no console para confirmar que está funcionando
console.log('🔥 Firebase inicializado com sucesso!');
console.log('📦 Projeto:', firebaseConfig.projectId);
console.log('💾 Modo: Firestore (sem Storage)');
console.log('🌐 Produtos sincronizados na nuvem');
