// ═══════════════════════════════════════════════════════════════════
// ADMIN.JS - PAINEL ADMINISTRATIVO
// ═══════════════════════════════════════════════════════════════════
// Este arquivo controla:
// - Verificação de login (proteção por senha)
// - Adicionar produtos ao Firebase
// - Remover produtos do Firebase
// - Upload e processamento de imagens
// - Listagem de produtos cadastrados
// ═══════════════════════════════════════════════════════════════════

// ============================================
// VERIFICAÇÃO DE LOGIN
// ============================================

/**
 * Verificar se o usuário está logado
 * Executa automaticamente ao carregar a página
 * Se não estiver logado, redireciona para a tela de login
 */
(function verificarLogin() {
    const estaLogado = localStorage.getItem('adminLogado');
    
    if (estaLogado !== 'true') {
        // Não está logado, redireciona para login
        window.location.href = 'login.html';
    }
})();

/**
 * Fazer logout do painel administrativo
 * Remove o login e volta para a tela de login
 */
function fazerLogout() {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        localStorage.removeItem('adminLogado'); // Remove o login
        window.location.href = 'login.html'; // Redireciona
    }
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE PRODUTOS COM FIREBASE
// ============================================

// Array temporário para armazenar as imagens selecionadas antes de salvar
let imagensSelecionadas = [];

/**
 * Carregar produtos do Firebase
 * Busca todos os produtos salvos na nuvem
 */
async function carregarProdutos() {
    try {
        // Busca a coleção 'produtos' ordenada por ID
        const snapshot = await db.collection('produtos').orderBy('id', 'asc').get();
        const produtos = [];
        
        // Percorre cada documento
        snapshot.forEach(doc => {
            produtos.push({
                docId: doc.id, // ID do documento no Firebase
                ...doc.data()  // Dados do produto
            });
        });
        
        return produtos;
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        alert('❌ Erro ao carregar produtos. Verifique sua conexão com a internet.');
        return [];
    }
}

/**
 * Converter arquivo de imagem para Base64
 * Base64 é um formato de texto que representa a imagem
 * Permite salvar a imagem diretamente no Firestore
 */
function converterImagemParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result); // Retorna o Base64
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file); // Lê o arquivo como Data URL (Base64)
    });
}

/**
 * Redimensionar imagem para economizar espaço
 * Reduz o tamanho da imagem para no máximo 800px de largura
 * Isso economiza espaço no Firestore e acelera o carregamento
 */
function redimensionarImagem(base64, maxWidth = 800) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Calcula as novas dimensões mantendo a proporção
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Desenha a imagem redimensionada no canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converte o canvas para Base64 com qualidade 80%
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = base64;
    });
}

/**
 * Processar imagens selecionadas pelo usuário
 * Quando o usuário seleciona fotos, este código:
 * 1. Valida o tipo e tamanho
 * 2. Converte para Base64
 * 3. Redimensiona
 * 4. Mostra preview
 */
document.getElementById('imagensProduto').addEventListener('change', async function(e) {
    const files = Array.from(e.target.files); // Pega todos os arquivos selecionados
    const previewContainer = document.getElementById('previewImagens');
    
    if (files.length === 0) return;
    
    // Mostra mensagem de processamento
    previewContainer.innerHTML = '<p style="color:#999;">📤 Processando imagens...</p>';
    
    try {
        // Processa cada arquivo
        for (const file of files) {
            // Valida se é uma imagem
            if (!file.type.startsWith('image/')) {
                alert(`❌ O arquivo "${file.name}" não é uma imagem válida!`);
                continue;
            }
            
            // Valida o tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`❌ A imagem "${file.name}" é muito grande! Máximo 5MB por imagem.`);
                continue;
            }
            
            // Converte para Base64
            const base64 = await converterImagemParaBase64(file);
            
            // Redimensiona para economizar espaço
            const base64Redimensionado = await redimensionarImagem(base64, 800);
            
            // Adiciona ao array temporário
            imagensSelecionadas.push({
                nome: file.name,
                data: base64Redimensionado
            });
        }
        
        // Atualiza o preview
        atualizarPreviewImagens();
        
    } catch (error) {
        console.error('Erro ao processar imagens:', error);
        alert('❌ Erro ao processar as imagens. Tente novamente.');
        previewContainer.innerHTML = '';
    }
});

/**
 * Atualizar preview das imagens
 * Mostra as miniaturas das imagens selecionadas
 */
function atualizarPreviewImagens() {
    const previewContainer = document.getElementById('previewImagens');
    
    if (imagensSelecionadas.length === 0) {
        previewContainer.innerHTML = '<p style="color:#999;">Nenhuma imagem selecionada</p>';
        return;
    }
    
    previewContainer.innerHTML = '';
    
    // Cria uma miniatura para cada imagem
    imagensSelecionadas.forEach((imagem, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        
        div.innerHTML = `
            <img src="${imagem.data}" alt="${imagem.nome}">
            <button type="button" class="btn-remover-preview" onclick="removerImagemPreview(${index})" title="Remover imagem">✖</button>
        `;
        
        previewContainer.appendChild(div);
    });
}

/**
 * Remover imagem do preview
 * Remove uma imagem antes de salvar o produto
 */
function removerImagemPreview(index) {
    imagensSelecionadas.splice(index, 1); // Remove do array
    atualizarPreviewImagens(); // Atualiza o preview
    
    // Se não houver mais imagens, limpa o input
    if (imagensSelecionadas.length === 0) {
        document.getElementById('imagensProduto').value = '';
    }
}

/**
 * Renderizar lista de produtos no painel admin
 * Mostra todos os produtos cadastrados
 */
async function renderizarListaProdutos() {
    const lista = document.getElementById('listaProdutos');
    const totalProdutos = document.getElementById('totalProdutos');
    
    // Mostra mensagem de carregamento
    lista.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">⏳ Carregando produtos...</p>';
    
    // Busca os produtos do Firebase
    const produtos = await carregarProdutos();
    
    // Atualiza o contador
    totalProdutos.textContent = produtos.length;
    
    // Se não houver produtos
    if (produtos.length === 0) {
        lista.innerHTML = `
            <div class="mensagem-vazia">
                <p>📦 Nenhum produto cadastrado ainda</p>
                <p style="font-size:14px;">Use o formulário ao lado para adicionar seu primeiro produto!</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = '';
    
    // Cria um card para cada produto
    produtos.forEach(produto => {
        const div = document.createElement('div');
        div.className = 'produto-item';
        
        // Cria as miniaturas das imagens
        const imagensHTML = produto.imagens.map(img => 
            `<img src="${img}" alt="${produto.nome}">`
        ).join('');
        
        // Monta o HTML do card
        div.innerHTML = `
            <h3>${produto.nome} ${produto.destaque ? '⭐' : ''}</h3>
            <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
            <span class="categoria-badge">${produto.categoria}</span>
            ${produto.descricao ? `<p style="font-size:12px;color:#666;margin:8px 0;font-style:italic;">"${produto.descricao}"</p>` : ''}
            <div class="imagens-preview">
                ${imagensHTML}
            </div>
            <p style="font-size:12px; color:#999;">ID: ${produto.id} | ${produto.imagens.length} imagem(ns)</p>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <button class="btn-destaque ${produto.destaque ? 'ativo' : ''}" onclick="alternarDestaque('${produto.docId}', ${!produto.destaque})" title="${produto.destaque ? 'Remover destaque' : 'Adicionar destaque'}">
                    ${produto.destaque ? '⭐ Em Destaque' : '☆ Destacar'}
                </button>
                <button class="btn-editar" onclick="abrirEdicaoProduto('${produto.docId}')">✏️ Editar</button>
                <button class="btn-remover" onclick="removerProduto('${produto.docId}')">🗑️ Remover</button>
            </div>
        `;
        
        lista.appendChild(div);
    });
}

/**
 * Adicionar novo produto
 * Processa o formulário e salva o produto no Firebase
 */
document.getElementById('formProduto').addEventListener('submit', async function(e) {
    e.preventDefault(); // Impede o envio padrão do formulário
    
    // Pega os valores do formulário
    const nome = document.getElementById('nomeProduto').value.trim();
    const preco = parseFloat(document.getElementById('precoProduto').value);
    let categoria = document.getElementById('categoriaProduto').value;
    const destaque = document.getElementById('produtoDestaque').checked;
    const descricao = document.getElementById('descricaoProduto').value.trim();
    
    // ========== VALIDAÇÕES ==========
    
    if (!nome) {
        alert('❌ Por favor, digite o nome do produto!');
        return;
    }
    
    if (preco <= 0 || isNaN(preco)) {
        alert('❌ Por favor, digite um preço válido!');
        return;
    }
    
    if (!categoria) {
        alert('❌ Por favor, selecione uma categoria!');
        return;
    }
    
    // Se escolheu "nova categoria", pega o valor do campo
    if (categoria === 'nova') {
        const novaCategoria = document.getElementById('novaCategoria').value.trim().toLowerCase();
        if (!novaCategoria) {
            alert('❌ Por favor, digite o nome da nova categoria!');
            return;
        }
        // Remove caracteres especiais e espaços
        categoria = novaCategoria.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    }
    
    if (imagensSelecionadas.length === 0) {
        alert('❌ Por favor, selecione pelo menos uma imagem!');
        return;
    }
    
    // ========== SALVAR NO FIREBASE ==========
    
    // Desabilita o botão e mostra loading
    const btnAdicionar = document.querySelector('.btn-adicionar');
    const textoOriginal = btnAdicionar.textContent;
    const editandoId = btnAdicionar.dataset.editandoId;
    btnAdicionar.disabled = true;
    btnAdicionar.textContent = '⏳ Salvando produto...';
    
    try {
        const imagens = imagensSelecionadas.map(img => img.data);
        
        if (editandoId) {
            // ========== MODO EDIÇÃO ==========
            btnAdicionar.textContent = '📤 Atualizando produto...';
            
            // Se não houver novas imagens, mantém as antigas
            let imagensFinais = imagens;
            if (imagens.length === 0) {
                const docAtual = await db.collection('produtos').doc(editandoId).get();
                imagensFinais = docAtual.data().imagens;
            }
            
            await db.collection('produtos').doc(editandoId).update({
                nome: nome,
                preco: preco,
                categoria: categoria,
                imagens: imagensFinais,
                destaque: destaque,
                descricao: descricao,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            cancelarEdicao();
            await renderizarListaProdutos();
            alert(`✅ Produto "${nome}" atualizado com sucesso!\n\n🌐 As alterações já estão disponíveis em todos os dispositivos!`);
            
        } else {
            // ========== MODO ADIÇÃO ==========
            if (imagens.length === 0) {
                alert('❌ Por favor, selecione pelo menos uma imagem!');
                return;
            }
            
            // Obter próximo ID (maior ID + 1)
            const produtos = await carregarProdutos();
            const novoId = produtos.length > 0 ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
            
            btnAdicionar.textContent = '📤 Enviando para nuvem...';
            
            // Cria o produto no Firestore
            await db.collection('produtos').add({
                id: novoId,
                nome: nome,
                preco: preco,
                categoria: categoria,
                imagens: imagens,
                destaque: destaque,
                descricao: descricao,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // ========== LIMPAR FORMULÁRIO ==========
            document.getElementById('formProduto').reset();
            document.getElementById('novaCategoriaGroup').style.display = 'none';
            imagensSelecionadas = [];
            document.getElementById('previewImagens').innerHTML = '<p style="color:#999;">Nenhuma imagem selecionada</p>';
            
            // Atualiza a lista de produtos
            await renderizarListaProdutos();
            
            // Mostra mensagem de sucesso
            alert(`✅ Produto "${nome}" adicionado com sucesso!\n\n🌐 O produto já está disponível em todos os dispositivos!`);
        }
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('❌ Erro ao salvar produto: ' + error.message + '\n\nVerifique sua conexão com a internet.');
    } finally {
        // Reabilita o botão
        btnAdicionar.disabled = false;
        btnAdicionar.textContent = textoOriginal;
    }
});

/**
 * Abrir modal de edição de produto
 */
async function abrirEdicaoProduto(docId) {
    try {
        const doc = await db.collection('produtos').doc(docId).get();
        if (!doc.exists) {
            alert('❌ Produto não encontrado!');
            return;
        }
        
        const produto = doc.data();
        
        // Preenche o formulário com os dados do produto
        document.getElementById('nomeProduto').value = produto.nome;
        document.getElementById('precoProduto').value = produto.preco;
        document.getElementById('categoriaProduto').value = produto.categoria;
        document.getElementById('descricaoProduto').value = produto.descricao || '';
        document.getElementById('produtoDestaque').checked = produto.destaque || false;
        
        // Pré-seleciona as imagens existentes
        imagensSelecionadas = produto.imagens.map((img, index) => ({
            nome: `Imagem ${index + 1}`,
            data: img
        }));
        
        // Mostra as imagens no preview
        atualizarPreviewImagens();
        
        // Mostra o aviso de imagens pré-selecionadas
        document.getElementById('avisoImagens').style.display = 'block';
        
        // Muda o botão para "Atualizar"
        const btnAdicionar = document.querySelector('.btn-adicionar');
        btnAdicionar.textContent = '💾 Atualizar Produto';
        btnAdicionar.dataset.editandoId = docId;
        
        // Mostra o botão de cancelar
        document.getElementById('btnCancelarEdicao').style.display = 'inline-block';
        
        // Scroll para o formulário
        document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
        
        alert('✏️ Editando produto: ' + produto.nome + '\n\nVocê pode:\n• Modificar nome, preço, descrição\n• Manter as imagens atuais\n• Ou selecionar novas imagens para substituir');
        
    } catch (error) {
        console.error('Erro ao abrir edição:', error);
        alert('❌ Erro ao abrir edição: ' + error.message);
    }
}

/**
 * Cancelar edição
 */
function cancelarEdicao() {
    document.getElementById('formProduto').reset();
    document.getElementById('novaCategoriaGroup').style.display = 'none';
    document.getElementById('avisoImagens').style.display = 'none';
    imagensSelecionadas = [];
    document.getElementById('previewImagens').innerHTML = '<p style="color:#999;">Nenhuma imagem selecionada</p>';
    
    const btnAdicionar = document.querySelector('.btn-adicionar');
    const btnCancelar = document.getElementById('btnCancelarEdicao');
    
    btnAdicionar.textContent = '➕ Adicionar Produto';
    btnCancelar.style.display = 'none';
    delete btnAdicionar.dataset.editandoId;
}

/**
 * Alternar destaque do produto
 * Marca ou desmarca um produto como destaque
 */
async function alternarDestaque(docId, novoStatus) {
    try {
        await db.collection('produtos').doc(docId).update({
            destaque: novoStatus
        });
        
        // Atualiza a lista
        await renderizarListaProdutos();
        
        const mensagem = novoStatus ? '⭐ Produto marcado como destaque!' : '☆ Destaque removido!';
        alert(mensagem);
        
    } catch (error) {
        console.error('Erro ao alterar destaque:', error);
        alert('❌ Erro ao alterar destaque: ' + error.message);
    }
}

/**
 * Remover produto do Firebase
 * Deleta o produto da nuvem
 */
async function removerProduto(docId) {
    try {
        // Busca o produto pelo ID do documento
        const doc = await db.collection('produtos').doc(docId).get();
        const produto = doc.data();
        
        if (!produto) {
            alert('❌ Produto não encontrado!');
            return;
        }
        
        // Confirma a remoção
        if (!confirm(`Tem certeza que deseja remover o produto:\n\n"${produto.nome}"\n\nEsta ação não pode ser desfeita e o produto será removido de TODOS os dispositivos!`)) {
            return;
        }
        
        // Remove o produto do Firestore
        await db.collection('produtos').doc(docId).delete();
        
        // Atualiza a lista
        await renderizarListaProdutos();
        
        alert(`✅ Produto "${produto.nome}" removido com sucesso!`);
        
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        alert('❌ Erro ao remover produto: ' + error.message);
    }
}

/**
 * Mostrar/ocultar campo de nova categoria
 * Quando seleciona "Nova Categoria", mostra o campo de texto
 */
document.getElementById('categoriaProduto').addEventListener('change', function() {
    const novaCategoriaGroup = document.getElementById('novaCategoriaGroup');
    if (this.value === 'nova') {
        novaCategoriaGroup.style.display = 'block';
        document.getElementById('novaCategoria').required = true;
    } else {
        novaCategoriaGroup.style.display = 'none';
        document.getElementById('novaCategoria').required = false;
    }
});

/**
 * Inicializar ao carregar a página
 * Carrega a lista de produtos e configura o preview
 */
document.addEventListener('DOMContentLoaded', function() {
    renderizarListaProdutos();
    
    document.getElementById('previewImagens').innerHTML = '<p style="color:#999;">Nenhuma imagem selecionada</p>';
    
    console.log('✅ Painel Administrativo carregado com sucesso!');
    console.log('🔥 Conectado ao Firebase (Firestore)');
});
