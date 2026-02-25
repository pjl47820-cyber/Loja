// ═══════════════════════════════════════════════════════════════════
// SCRIPT.JS - LÓGICA DO SITE COM CARROSSEL
// ═══════════════════════════════════════════════════════════════════

console.log('🚀 Script.js carregado!');
console.log('🔥 Firebase disponível?', typeof firebase !== 'undefined');
console.log('💾 Firestore disponível?', typeof db !== 'undefined');

async function carregarProdutos() {
    try {
        console.log('📡 Buscando produtos do Firebase...');
        const snapshot = await db.collection('produtos').orderBy('id', 'asc').get();
        const produtos = [];
        snapshot.forEach(doc => {
            produtos.push({ docId: doc.id, ...doc.data() });
        });
        console.log('✅ Produtos encontrados:', produtos.length);
        console.log('📦 Dados dos produtos:', produtos);
        return produtos;
    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos: ' + error.message);
        return [];
    }
}

const slidersAtivos = {};

async function renderizarProdutos() {
    const catalogo = document.getElementById("catalogo");
    catalogo.innerHTML = '<p style="text-align:center; padding:50px;">⏳ Carregando...</p>';

    const produtos = await carregarProdutos();
    console.log('📦 Produtos carregados:', produtos.length);
    
    if (produtos.length === 0) {
        catalogo.innerHTML = '<p style="text-align:center; padding:50px;">📦 Nenhum produto.</p>';
        return;
    }

    // Ordena produtos: destaques primeiro, depois por ID
    produtos.sort((a, b) => {
        if (a.destaque && !b.destaque) return -1;
        if (!a.destaque && b.destaque) return 1;
        return a.id - b.id;
    });

    catalogo.innerHTML = '';

    produtos.forEach(produto => {
        console.log('🎨 Renderizando produto:', produto.nome);
        
        const div = document.createElement("div");
        div.className = `produto ${produto.categoria}`;
        
        // Garante que imagens seja um array
        const imagens = Array.isArray(produto.imagens) ? produto.imagens : [produto.imagens];
        console.log('🖼️ Imagens do produto:', imagens.length);
        
        let slidesHTML = "";
        imagens.forEach((img) => {
            slidesHTML += `<div class="slide-item"><img src="${img}" onclick="abrirModal('${img}')"></div>`;
        });

        div.innerHTML = `
            ${produto.destaque ? '<div class="badge-destaque">⭐ DESTAQUE</div>' : ''}
            <div class="slider-container" id="slider-${produto.id}">
                <div class="slider-wrapper">${slidesHTML}</div>
                ${imagens.length>1?`<div class="slider-indicator">${imagens.map((_, i) => `<span class="indicator-dot ${i===0?'active':''}"></span>`).join('')}</div>`:''}
            </div>
            <h3>${produto.nome}</h3>
            <p style="font-size:20px;color:#e03e39;font-weight:bold">R$ ${produto.preco.toFixed(2)}</p>
            ${produto.descricao ? `<p style="font-size:13px;color:#666;margin:10px 0;line-height:1.4;text-align:left;padding:0 5px;border-left:3px solid #e6d6f5;padding-left:10px;">${produto.descricao}</p>` : ''}
            <div class="quantidade-container">
                <button class="btn-quantidade" onclick="alterarQuantidade('${produto.id}', -1)">-</button>
                <input type="number" id="qtd-${produto.id}" value="1" min="1" max="99" readonly>
                <button class="btn-quantidade" onclick="alterarQuantidade('${produto.id}', 1)">+</button>
            </div>
            <button onclick="adicionarCarrinhoComQuantidade('${produto.nome.replace(/'/g,"\\'")}',${produto.preco},'${imagens[0]}','${produto.id}')">Adicionar ao Carrinho</button>
        `;
        
        catalogo.appendChild(div);
        console.log('✅ Produto adicionado ao DOM:', produto.nome);
        
        if (imagens.length>1) setTimeout(()=>inicializarSlider(`slider-${produto.id}`,imagens.length),100);
    });
    
    console.log('🎉 Todos os produtos renderizados!');
}

function inicializarSlider(id, total) {
    slidersAtivos[id] = 0;
    const wrapper = document.querySelector(`#${id} .slider-wrapper`);
    const container = document.getElementById(id);
    
    if (!wrapper || !container) return;
    
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startTime = 0;
    
    // Touch events (mobile)
    wrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        currentX = startX;
        isDragging = true;
        startTime = Date.now();
        wrapper.style.transition = 'none';
    });
    
    wrapper.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const currentSlide = slidersAtivos[id];
        const offset = -(currentSlide * 100) + (diff / wrapper.offsetWidth * 100);
        wrapper.style.transform = `translateX(${offset}%)`;
    });
    
    wrapper.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.style.transition = 'transform 0.3s ease';
        
        const diff = currentX - startX;
        const threshold = 50; // pixels mínimos para trocar
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Deslizou para direita - volta
                moverSlide(id, -1);
            } else {
                // Deslizou para esquerda - avança
                moverSlide(id, 1);
            }
        } else {
            // Não deslizou o suficiente, volta para posição atual
            atualizarSlider(id);
        }
    });
    
    // Mouse events (desktop)
    wrapper.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        currentX = startX;
        isDragging = true;
        startTime = Date.now();
        wrapper.style.cursor = 'grabbing';
        wrapper.style.transition = 'none';
        e.preventDefault();
    });
    
    wrapper.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
        const diff = currentX - startX;
        const currentSlide = slidersAtivos[id];
        const offset = -(currentSlide * 100) + (diff / wrapper.offsetWidth * 100);
        wrapper.style.transform = `translateX(${offset}%)`;
    });
    
    wrapper.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.style.cursor = 'grab';
        wrapper.style.transition = 'transform 0.3s ease';
        
        const diff = currentX - startX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                moverSlide(id, -1);
            } else {
                moverSlide(id, 1);
            }
        } else {
            atualizarSlider(id);
        }
    });
    
    wrapper.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            wrapper.style.cursor = 'grab';
            wrapper.style.transition = 'transform 0.3s ease';
            atualizarSlider(id);
        }
    });
}

function moverSlide(id,dir) {
    const slider=document.getElementById(id);
    if(!slider)return;
    const total=slider.querySelectorAll('.slide-item').length;
    slidersAtivos[id]=(slidersAtivos[id]+dir+total)%total;
    atualizarSlider(id);
}

function irParaSlide(id,i) {
    slidersAtivos[id]=i;
    atualizarSlider(id);
}

function atualizarSlider(id) {
    const slider = document.getElementById(id);
    if (!slider) return;
    
    const idx = slidersAtivos[id];
    const wrapper = slider.querySelector('.slider-wrapper');
    
    if (wrapper) {
        wrapper.style.transform = `translateX(-${idx * 100}%)`;
    }
    
    // Atualiza os indicadores (bolinhas)
    const dots = slider.querySelectorAll('.indicator-dot');
    dots.forEach((dot, i) => {
        dot.className = i === idx ? 'indicator-dot active' : 'indicator-dot';
    });
}

function abrirModal(src) {
    document.getElementById("imagemModal").src=src;
    document.getElementById("modal").style.display="flex";
}

function fecharModal() {
    document.getElementById("modal").style.display="none";
}

function filtrar(cat) {
    console.log('🔍 Filtrando por categoria:', cat);
    document.querySelectorAll(".produto").forEach(p=>{
        p.style.display=(cat==="todos"||p.classList.contains(cat))?"block":"none";
    });
}

function alterarQuantidade(produtoId, delta) {
    const input = document.getElementById(`qtd-${produtoId}`);
    if (!input) return;
    
    let valor = parseInt(input.value) || 1;
    valor += delta;
    
    // Limita entre 1 e 99
    if (valor < 1) valor = 1;
    if (valor > 99) valor = 99;
    
    input.value = valor;
}

function adicionarCarrinhoComQuantidade(nome, preco, img, produtoId) {
    const input = document.getElementById(`qtd-${produtoId}`);
    const quantidade = parseInt(input.value) || 1;
    
    // Verifica se o produto já existe no carrinho
    const produtoExistente = carrinho.find(item => item.nome === nome);
    
    if (produtoExistente) {
        // Se já existe, apenas aumenta a quantidade
        produtoExistente.quantidade += quantidade;
    } else {
        // Se não existe, adiciona novo produto com quantidade
        carrinho.push({
            nome: nome,
            preco: preco,
            imagem: img,
            quantidade: quantidade
        });
    }
    
    atualizarContadorCarrinho();
    atualizarCarrinho();
    
    // Reseta a quantidade para 1
    input.value = 1;
    
    // Feedback visual
    if (quantidade === 1) {
        alert(`✅ ${nome} adicionado ao carrinho!`);
    } else {
        alert(`✅ ${quantidade}x ${nome} adicionados ao carrinho!`);
    }
}

function atualizarContadorCarrinho() {
    const contador = document.getElementById("contador");
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    contador.innerText = totalItens;
}

let carrinho=[];

function atualizarCarrinho(){
    const lista = document.getElementById("listaCarrinho");
    const total = document.getElementById("totalCarrinho");
    
    if (!lista || !total) return;
    
    lista.innerHTML="";
    
    if (carrinho.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio</p>';
        total.innerText = "Total: R$ 0,00";
        return;
    }
    
    let t = 0;
    
    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        t += subtotal;
        
        const li = document.createElement("li");
        li.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:10px;background:#f9f9f9;border-radius:8px;gap:10px";
        
        li.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
                <img src="${item.imagem}" style="width:50px;height:50px;border-radius:8px;object-fit:cover;flex-shrink:0">
                <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:bold;margin-bottom:3px">${item.nome}</div>
                    <div style="color:#e03e39;font-weight:bold;font-size:14px">R$ ${item.preco.toFixed(2)}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <div style="display:flex;align-items:center;gap:5px;background:white;border-radius:8px;padding:3px">
                    <button onclick="alterarQuantidadeCarrinho(${index}, -1)" class="btn-qtd-carrinho">-</button>
                    <span style="font-weight:bold;min-width:25px;text-align:center;font-size:14px">${item.quantidade}</span>
                    <button onclick="alterarQuantidadeCarrinho(${index}, 1)" class="btn-qtd-carrinho">+</button>
                </div>
                <button onclick="removerProdutoCarrinho(${index})" class="btn-remover" title="Remover">🗑️</button>
            </div>
        `;
        
        lista.appendChild(li);
    });
    
    total.innerText = "Total: R$ " + t.toFixed(2);
}

document.addEventListener("DOMContentLoaded",function(){
    console.log('📄 DOM carregado, iniciando renderização...');
    renderizarProdutos();
    
    const contador=document.getElementById("contador");
    const painel=document.getElementById("painelCarrinho");
    const overlay=document.getElementById("overlayCarrinho");
    
    console.log('🛒 Painel do carrinho:', painel);
    console.log('🔘 Botão do carrinho:', document.getElementById("botaoCarrinho"));
    
    document.getElementById("botaoCarrinho").addEventListener("click",function(){
        console.log('🛒 Clicou no carrinho!');
        painel.classList.toggle("ativo");
        overlay.classList.toggle("ativo");
        console.log('✅ Classe ativo toggled. Classes:', painel.className);
    });
    
    document.getElementById("fecharCarrinhoBtn").addEventListener("click",()=>{
        painel.classList.remove("ativo");
        overlay.classList.remove("ativo");
    });
    
    overlay.addEventListener("click",()=>{
        painel.classList.remove("ativo");
        overlay.classList.remove("ativo");
    });
    
    window.adicionarCarrinho=function(nome,preco,img){
        carrinho.push({nome,preco,imagem:img,quantidade:1});
        atualizarContadorCarrinho();
        atualizarCarrinho();
    };
    
    window.removerItem=function(i){
        carrinho.splice(i,1);
        atualizarContadorCarrinho();
        atualizarCarrinho();
    };
    
    window.alterarQuantidadeCarrinho=function(index, delta){
        if (index < 0 || index >= carrinho.length) return;
        
        carrinho[index].quantidade += delta;
        
        // Se a quantidade chegar a 0, remove o produto
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
        
        atualizarContadorCarrinho();
        atualizarCarrinho();
    };
    
    window.removerProdutoCarrinho=function(index){
        if (index < 0 || index >= carrinho.length) return;
        
        const produto = carrinho[index];
        if (confirm(`Remover ${produto.nome} do carrinho?`)) {
            carrinho.splice(index, 1);
            atualizarContadorCarrinho();
            atualizarCarrinho();
        }
    };
    
    window.removerUmItem=function(nomeProduto){
        const index = carrinho.findIndex(item => item.nome === nomeProduto);
        if (index !== -1) {
            carrinho.splice(index, 1);
            atualizarContadorCarrinho();
            atualizarCarrinho();
        }
    };
    
    window.removerTodosItens=function(nomeProduto){
        carrinho = carrinho.filter(item => item.nome !== nomeProduto);
        atualizarContadorCarrinho();
        atualizarCarrinho();
    };
    
    document.getElementById("finalizarPedidoBtn").addEventListener("click",function(){
        if(carrinho.length===0){alert("Carrinho vazio!");return;}
        let msg="🛍️ *Olá! Gostaria de fazer o seguinte pedido:*\n\n";
        let t=0;
        carrinho.forEach(item=>{
            const subtotal = item.preco * item.quantidade;
            msg+=`• ${item.quantidade}x ${item.nome}\n  💰 R$ ${item.preco.toFixed(2)} cada\n  Subtotal: R$ ${subtotal.toFixed(2)}\n\n`;
            t+=subtotal;
        });
        msg+=`*Total: R$ ${t.toFixed(2)}*`;
        window.open("https://wa.me/5586995630268?text="+encodeURIComponent(msg),"_blank");
    });
});
