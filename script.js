// =================================================================
// ⚙️ CONFIGURAÇÕES (EDITE AQUI!)
// =================================================================
const ENDERECO_DA_LOJA = "rua tupassi, 7, Cosmos, Rio de Janeiro, RJ"; 
const WHATSAPP_NUMERO = "5521973043816"; 
const RAIO_MAXIMO_KM = 6;

// =================================================================
// ⚠️ LÓGICA DO SISTEMA
// =================================================================

let carrinho = [];
let valorEntrega = 0;
let distanciaCalculada = 0;
let lojaLat = 0;
let lojaLon = 0;

// --- 1. INICIALIZAÇÃO ---

window.addEventListener('load', function() {
    limparCamposFormulario();
    configurarLoja();
});

function limparCamposFormulario() {
    document.getElementById('input-nome').value = "";
    document.getElementById('input-cep').value = "";
    document.getElementById('input-endereco').value = "";
    document.getElementById('input-numero').value = "";
    document.getElementById('input-comp').value = "";
    document.getElementById('select-pagamento').value = "";
    // Limpa a area de troco
    document.getElementById('area-troco').style.display = 'none';
    document.getElementById('input-troco').value = "";
    const radios = document.getElementsByName('precisa-troco');
    radios[0].checked = true; // Marca "Não" como padrão

    const aviso = document.getElementById('aviso-calculo');
    if(aviso) {
        aviso.innerText = "🛵 Digite CEP ou Endereço para calcular.";
        aviso.style.color = "#aaa";
    }
}

async function configurarLoja() {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ENDERECO_DA_LOJA)}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.length > 0) {
            lojaLat = parseFloat(d[0].lat);
            lojaLon = parseFloat(d[0].lon);
            console.log("✅ Loja localizada!");
        }
    } catch (e) { console.error(e); }
}

// --- 2. FILTRO DE PESQUISA (NOVA FUNÇÃO) ---
function filtrarCardapio() {
    const termo = document.getElementById('search-input').value.toLowerCase();
    const cards = document.getElementsByClassName('item-card');
    
    for (let card of cards) {
        const nomeProduto = card.querySelector('h3').innerText.toLowerCase();
        if (nomeProduto.includes(termo)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    }
}

// --- 3. CARRINHO E NAVEGAÇÃO ---

function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('cart-open'); }

function adicionarPedido(nome, preco) {
    carrinho.push({ nome: nome, preco: preco });
    atualizarCarrinhoVisual();
    if (!document.getElementById('cart-sidebar').classList.contains('cart-open')) toggleCart();
}

function limparCarrinho() {
    carrinho = [];
    valorEntrega = 0;
    atualizarCarrinhoVisual();
    limparCamposFormulario();
    document.getElementById('taxa-entrega').innerText = "R$ 0,00";
    document.getElementById('total-final').innerText = "R$ 0,00";
}

function atualizarCarrinhoVisual() {
    const lista = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    const contador = document.getElementById('cart-count');
    lista.innerHTML = '';
    let total = 0;
    carrinho.forEach(item => {
        total += item.preco;
        let li = document.createElement('li');
        li.innerHTML = `<span>${item.nome}</span><span style="color:#ffcc00">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>`;
        lista.appendChild(li);
    });
    totalEl.textContent = total.toFixed(2).replace('.', ',');
    contador.textContent = carrinho.length;
}

function irParaCheckout() {
    if (carrinho.length === 0) {
        alert("Carrinho vazio!");
        return;
    }
    document.getElementById('aba-carrinho').classList.remove('ativa');
    document.getElementById('aba-checkout').classList.add('ativa');
    atualizarTotalComFrete();
}

function voltarParaCarrinho() {
    document.getElementById('aba-checkout').classList.remove('ativa');
    document.getElementById('aba-carrinho').classList.add('ativa');
}

function fecharPedidoTotal() {
    limparCarrinho();
    document.getElementById('aba-sucesso').classList.remove('ativa');
    document.getElementById('aba-carrinho').classList.add('ativa');
    toggleCart();
}

// --- 4. LÓGICA DE TROCO (NOVA) ---

function verificarPagamento() {
    const pagamento = document.getElementById('select-pagamento').value;
    const areaTroco = document.getElementById('area-troco');
    
    if (pagamento === "Dinheiro") {
        areaTroco.style.display = "block";
    } else {
        areaTroco.style.display = "none";
        // Reseta campos se mudar para cartão
        document.getElementsByName('precisa-troco')[0].checked = true;
        toggleCampoTroco(false);
    }
}

function toggleCampoTroco(precisa) {
    const campoInput = document.getElementById('campo-valor-troco');
    if (precisa) {
        campoInput.style.display = "block";
    } else {
        campoInput.style.display = "none";
        document.getElementById('input-troco').value = "";
    }
}

// --- 5. ENDEREÇO E CÁLCULO ---

async function buscarPeloCep() {
    const cep = document.getElementById('input-cep').value.replace(/\D/g, ''); 
    const campoEndereco = document.getElementById('input-endereco');
    const aviso = document.getElementById('aviso-calculo');

    if (cep.length !== 8) return; 
    aviso.innerText = "🔍 Buscando CEP...";
    aviso.style.color = "#ffcc00";

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) {
            aviso.innerText = "❌ CEP não encontrado!";
            aviso.style.color = "red";
            return;
        }
        const enderecoCompleto = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
        campoEndereco.value = enderecoCompleto;
        calcularDistanciaPorTexto(enderecoCompleto);
        document.getElementById('input-numero').focus();
    } catch (error) { console.error(error); }
}

async function buscarPeloEndereco() {
    const enderecoDigitado = document.getElementById('input-endereco').value;
    const campoCep = document.getElementById('input-cep');
    
    if (enderecoDigitado.length < 5) return;
    if(campoCep.value.length === 8) {
        calcularDistanciaPorTexto(enderecoDigitado);
        return;
    }
    const aviso = document.getElementById('aviso-calculo');
    aviso.innerText = "🔍 Verificando...";
    aviso.style.color = "#ffcc00";

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(enderecoDigitado)}`;
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.length > 0) {
            if (dados[0].address && dados[0].address.postcode) {
                let cep = dados[0].address.postcode.replace(/\D/g, '');
                if (cep.length === 8) campoCep.value = cep;
            }
            calcularDistanciaLatLon(parseFloat(dados[0].lat), parseFloat(dados[0].lon));
        } else {
            aviso.innerText = "⚠️ Endereço não exato.";
        }
    } catch (e) { console.error(e); }
}

async function calcularDistanciaPorTexto(texto) {
    if (lojaLat === 0) return;
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.length > 0) {
            calcularDistanciaLatLon(parseFloat(d[0].lat), parseFloat(d[0].lon));
        }
    } catch (e) { console.error(e); }
}

function calcularDistanciaLatLon(clienteLat, clienteLon) {
    const aviso = document.getElementById('aviso-calculo');
    const distanciaKm = getDistanciaEmKm(lojaLat, lojaLon, clienteLat, clienteLon);
    distanciaCalculada = distanciaKm;

    if (distanciaKm > RAIO_MAXIMO_KM) {
        aviso.innerText = `❌ Longe (${distanciaKm.toFixed(1)}km). Limite: ${RAIO_MAXIMO_KM}km.`;
        aviso.style.color = "#ff4444";
        valorEntrega = 0;
    } else {
        if (distanciaKm <= 2) valorEntrega = 3.00;
        else if (distanciaKm <= 4) valorEntrega = 5.00;
        else valorEntrega = 8.00;
        
        aviso.innerText = `✅ Entrega: ${distanciaKm.toFixed(1)}km (R$ ${valorEntrega.toFixed(2)})`;
        aviso.style.color = "#25d366";
    }
    atualizarTotalComFrete();
}

function getDistanciaEmKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function atualizarTotalComFrete() {
    let total = carrinho.reduce((sum, item) => sum + item.preco, 0);
    document.getElementById('taxa-entrega').innerText = `R$ ${valorEntrega.toFixed(2).replace('.', ',')}`;
    document.getElementById('total-final').innerText = `R$ ${(total + valorEntrega).toFixed(2).replace('.', ',')}`;
}

// --- 6. ENVIAR PEDIDO ---

function enviarPedidoZap() {
    const nome = document.getElementById('input-nome').value;
    const endereco = document.getElementById('input-endereco').value;
    const numero = document.getElementById('input-numero').value;
    const comp = document.getElementById('input-comp').value;
    const pag = document.getElementById('select-pagamento').value;
    
    if (nome === "" || endereco === "" || numero === "" || pag === "") {
        alert("Preencha Nome, Endereço, Número e Pagamento!");
        return;
    }
    if (distanciaCalculada > RAIO_MAXIMO_KM) {
        alert(`Endereço muito distante. Limite: ${RAIO_MAXIMO_KM}km.`);
        return;
    }

    // Cálculos
    let total = carrinho.reduce((sum, item) => sum + item.preco, 0);
    let totalComFrete = total + valorEntrega;

    // Lógica do Troco
    let infoTroco = "";
    if (pag === "Dinheiro") {
        const precisaTroco = document.querySelector('input[name="precisa-troco"]:checked').value;
        if (precisaTroco === "sim") {
            const valorTroco = parseFloat(document.getElementById('input-troco').value);
            if (!valorTroco || valorTroco < totalComFrete) {
                alert("Valor para troco inválido ou menor que o total!");
                return;
            }
            const diferenca = valorTroco - totalComFrete;
            infoTroco = ` (Troco p/ R$ ${valorTroco.toFixed(2)} -> Levar R$ ${diferenca.toFixed(2)})`;
        } else {
            infoTroco = " (Não precisa de troco)";
        }
    }

    const enderecoFinal = `${endereco}, Nº ${numero} ${comp ? '('+comp+')' : ''}`;

    let msg = `🛑 *NOVO PEDIDO CHEGANDO!* 🛑%0A%0A`;
    
    msg += `📋 *DADOS DO CLIENTE:*%0A`;
    msg += `👤 *Nome:* ${nome}%0A`;
    msg += `📍 *Local:* ${enderecoFinal}%0A`;
    msg += `🗺️ *Distância:* ${distanciaCalculada.toFixed(1)}km%0A`;
    msg += `💳 *Pagamento:* ${pag}${infoTroco}%0A`;
    msg += `__________________________________%0A%0A`; 
    
    msg += `🍔 *ITENS DO PEDIDO:*%0A`;
    carrinho.forEach(item => {
        msg += `▪️ 1x ${item.nome} ... R$ ${item.preco.toFixed(2).replace('.', ',')}%0A`;
    });
    msg += `__________________________________%0A%0A`;
    
    msg += `💰 *RESUMO FINANCEIRO:*%0A`;
    msg += `📦 Subtotal: R$ ${total.toFixed(2).replace('.', ',')}%0A`;
    msg += `🛵 Taxa Entrega: R$ ${valorEntrega.toFixed(2).replace('.', ',')}%0A`;
    msg += `✅ *TOTAL A COBRAR: R$ ${totalComFrete.toFixed(2).replace('.', ',')}*%0A%0A`;
    
    msg += `🕐 *Aguardando confirmação da loja...*`;

    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`, '_blank');
    document.getElementById('aba-checkout').classList.remove('ativa');
    document.getElementById('aba-sucesso').classList.add('ativa');
}