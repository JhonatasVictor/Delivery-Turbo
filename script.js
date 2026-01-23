let carrinho = [];
let taxaEntrega = 5.00; 

// --- FUNÇÕES BÁSICAS ---

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('cart-open');
}

function adicionarPedido(nome, preco) {
    carrinho.push({ nome: nome, preco: preco });
    atualizarCarrinhoVisual();
    
    // NOVO: Limpa a mensagem de erro se ela estiver aparecendo
    document.getElementById('msg-erro').innerText = ""; 

    // Abre o carrinho automaticamente
    const sidebar = document.getElementById('cart-sidebar');
    if (!sidebar.classList.contains('cart-open')) toggleCart();
}

function limparCarrinho() {
    carrinho = [];
    atualizarCarrinhoVisual();
}

function atualizarCarrinhoVisual() {
    const lista = document.getElementById('cart-items-list');
    const totalElemento = document.getElementById('cart-total-price');
    const contador = document.getElementById('cart-count');
    
    lista.innerHTML = '';
    let total = 0;
    
    carrinho.forEach(item => {
        total += item.preco;
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.nome}</span> <span style="color:#ffcc00">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>`;
        lista.appendChild(li);
    });
    
    totalElemento.textContent = total.toFixed(2).replace('.', ',');
    contador.textContent = carrinho.length;
}

// --- LÓGICA DE TRANSIÇÃO E CHECKOUT ---

function irParaCheckout() {
    if (carrinho.length === 0) {
        // NOVO: Ao invés de alert, mostra na tela
        const msgErro = document.getElementById('msg-erro');
        msgErro.innerText = "Seu carrinho está vazio! Adicione itens. 🍔";
        
        // Efeito visual opcional: Treme o botão ou texto (pode adicionar depois)
        return;
    }
    
    // ... resto da função igual ...
    document.getElementById('aba-carrinho').classList.remove('ativa');
    document.getElementById('aba-checkout').classList.add('ativa');
    
    let totalProdutos = carrinho.reduce((sum, item) => sum + item.preco, 0);
    let totalFinal = totalProdutos + taxaEntrega;
    
    document.getElementById('taxa-entrega').innerText = `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`;
    document.getElementById('total-final').innerText = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
}
function voltarParaCarrinho() {
    // Animação inversa
    document.getElementById('aba-checkout').classList.remove('ativa');
    document.getElementById('aba-carrinho').classList.add('ativa');
}

function enviarPedidoZap() {
    const nome = document.getElementById('input-nome').value;
    const endereco = document.getElementById('input-endereco').value;
    const pagamento = document.getElementById('select-pagamento').value;
    
    // Validação
    if (nome === "" || endereco === "" || pagamento === "") {
        alert("Ops! Preencha seus dados para a entrega. 📝");
        return;
    }

    // --- MONTAGEM DA MENSAGEM ---
    // %0A é a quebra de linha no WhatsApp
    // *texto* deixa em negrito
    
    let mensagem = `🔔 *NOVO PEDIDO CHEGANDO* 🔔%0A%0A`;
    
    // Dados do Cliente
    mensagem += `👤 *Cliente:* ${nome}%0A`;
    mensagem += `📍 *Endereço:* ${endereco}%0A`;
    mensagem += `💳 *Pagamento:* ${pagamento}%0A`;
    mensagem += `-----------------------------------%0A`;
    
    // Itens do Pedido
    mensagem += `🍔 *ITENS DO PEDIDO:*%0A%0A`;
    
    carrinho.forEach(item => {
        // Formata: "▪️ 1x X-Bacon ... R$ 25,90"
        mensagem += `▪️ 1x ${item.nome} ... R$ ${item.preco.toFixed(2).replace('.', ',')}%0A`;
    });
    
    // Cálculos Finais
    let totalProdutos = carrinho.reduce((sum, item) => sum + item.preco, 0);
    let totalFinal = totalProdutos + taxaEntrega;
    
    mensagem += `%0A-----------------------------------%0A`;
    mensagem += `📦 *Subtotal:* R$ ${totalProdutos.toFixed(2).replace('.', ',')}%0A`;
    mensagem += `🛵 *Taxa de Entrega:* R$ ${taxaEntrega.toFixed(2).replace('.', ',')}%0A`;
    mensagem += `✅ *TOTAL A PAGAR:* *R$ ${totalFinal.toFixed(2).replace('.', ',')}*%0A`;
    mensagem += `-----------------------------------%0A`;
    mensagem += `Aguardo a confirmação! 🚀`;

    // --- FIM DA MENSAGEM ---

    // 1. Abre o WhatsApp
    // Substitua o número abaixo pelo seu (Use o formato 55 + DDD + Numero)
    window.open(`https://wa.me/5521999999999?text=${mensagem}`, '_blank');

    // 2. Mostra a tela de sucesso no site
    document.getElementById('aba-checkout').classList.remove('ativa');
    document.getElementById('aba-sucesso').classList.add('ativa');
}

// Função para botão "Fazer Novo Pedido" na tela de sucesso
function fecharPedidoTotal() {
    // Limpa o carrinho
    limparCarrinho();
    
    // Volta para a tela inicial do carrinho (vazia)
    document.getElementById('aba-sucesso').classList.remove('ativa');
    document.getElementById('aba-carrinho').classList.add('ativa');
    
    // Fecha a aba lateral
    toggleCart();
}