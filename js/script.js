// =========================
// CONEXÃO COM SUPABASE
// =========================

const SUPABASE_URL = "https://birigivcirxthvpuqzyk.supabase.co";

const SUPABASE_KEY = "sb_publishable_IHu8ptRYGbM1xk5Y_i5abQ_2mlUZOT7";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
document.addEventListener("DOMContentLoaded", () => {

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    const listaCarrinho = document.querySelector("#lista-carrinho");
    const totalCarrinho = document.querySelector("#total-carrinho");

    const contador = document.querySelector("#contador-carrinho");
    const botoesComprar = document.querySelectorAll(".btn-comprar");

    const btnCarrinho = document.querySelector("#btn-carrinho");
    const carrinhoLateral = document.querySelector("#carrinho-lateral");
    const overlay = document.querySelector("#overlay-carrinho");
    const fecharCarrinho = document.querySelector("#fechar-carrinho");
    const finalizarWhatsApp = document.querySelector("#finalizar-whatsapp");


    // =========================
    // SALVAR CARRINHO
    // =========================

    function salvarCarrinho() {
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
    }


    // =========================
    // ABRIR CARRINHO
    // =========================

btnCarrinho.addEventListener("click", (e) => {
    e.preventDefault();

    atualizarCarrinho();

    carrinhoLateral.classList.add("ativo");
    overlay.classList.add("ativo");
});


    // =========================
    // FECHAR CARRINHO
    // =========================

    fecharCarrinho.addEventListener("click", () => {

        carrinhoLateral.classList.remove("ativo");
        overlay.classList.remove("ativo");

    });


    overlay.addEventListener("click", () => {

        carrinhoLateral.classList.remove("ativo");
        overlay.classList.remove("ativo");

    });
    // =========================
// VARIAÇÕES DE PESO
// =========================

const produtosComVariacao = document.querySelectorAll(".produto");

produtosComVariacao.forEach(produto => {

    const opcoes = produto.querySelectorAll(".opcao-variacao");
    const preco = produto.querySelector(".preco-variacao");

    if (!opcoes.length || !preco) return;

    opcoes.forEach(opcao => {

        opcao.addEventListener("click", () => {

            // Remove seleção das outras opções
            opcoes.forEach(item => {
                item.classList.remove("ativo");
            });

            // Seleciona a opção clicada
            opcao.classList.add("ativo");

            // Pega preço e peso
            const novoPreco = opcao.dataset.preco;
            const novoPeso = opcao.dataset.peso;
            const novaImagem = opcao.dataset.imagem;

const imagemProduto = produto.querySelector(".imagem-produto");

if (imagemProduto && novaImagem) {
    imagemProduto.src = novaImagem;
}

            // Atualiza o preço na tela
            preco.innerHTML = `R$ ${novoPreco} <small>${novoPeso}</small>`;
        });

    });

});


// =========================
// BOTÕES COMPRAR
// =========================

botoesComprar.forEach(botao => {

    botao.addEventListener("click", () => {

        const produto = botao.closest(".produto");

        const nome = produto.querySelector("h3").textContent;
        const marca = produto.querySelector(".marca").textContent;

        // Verifica se o produto possui variação
        const variacaoSelecionada = produto.querySelector(".opcao-variacao.ativo");

        let preco;
        let peso = null;

        if (variacaoSelecionada) {

            preco = variacaoSelecionada.dataset.preco;
            peso = variacaoSelecionada.dataset.peso;

        } else {

            preco = produto.querySelector(".preco").textContent;

        }

        // Procura o mesmo produto + mesma variação
        const existente = carrinho.find(item =>
            item.nome === nome &&
            item.variacao === peso
        );

        if (existente) {

            existente.quantidade++;

        } else {

            carrinho.push({
                nome: nome,
                marca: marca,
                preco: `R$ ${preco}`,
                variacao: peso,
                quantidade: 1
            });

        }

        contador.textContent = carrinho.reduce(
            (total, item) => total + item.quantidade,
            0
        );

        salvarCarrinho();
        atualizarCarrinho();

    });

});


// =========================
// FINALIZAR PEDIDO
// =========================

finalizarWhatsApp.addEventListener("click", async () => {

    if (carrinho.length === 0) {
        mostrarMensagem(
            "Carrinho vazio",
            "Adicione algum produto antes de finalizar o pedido.",
            "!"
        );
        return;
    }

    // =========================
    // VERIFICAR USUÁRIO LOGADO
    // =========================

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {
        mostrarMensagem(
            "Entre na sua conta",
            "Faça login para finalizar o pedido.",
            "!"
        );
        return;
    }

    // =========================
    // CALCULAR TOTAL
    // =========================

    let total = 0;

const pedidoId = crypto.randomUUID();

const produtosPedido = carrinho.map(item => {

    const preco = parseFloat(
        item.preco
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
    );

    const subtotal = preco * item.quantidade;

    total += subtotal;

    return {
        user_id: user.id,
        pedido_id: pedidoId,
        produto: item.nome,
        quantidade: item.quantidade,
        variacao: null,
        valor: subtotal,
        status: "Recebido"
    };
});

    // =========================
    // SALVAR PEDIDO
    // =========================

    const { error } = await supabaseClient
        .from("pedidos")
        .insert(produtosPedido);

    if (error) {
        console.error("Erro ao salvar pedido:", error);

        mostrarMensagem(
            "Erro",
            "Não foi possível registrar o pedido.",
            "!"
        );

        return;
    }

    // =========================
    // MONTAR MENSAGEM WHATSAPP
    // =========================

    let mensagem =
        "Olá! Gostaria de fazer um pedido.%0A%0A";

    carrinho.forEach(item => {

        mensagem +=
            "• " + item.nome +
            "%0AQuantidade: " + item.quantidade +
            "%0APreço: " + item.preco +
            "%0A%0A";
    });

    mensagem +=
        "Total: R$ " +
        total.toFixed(2).replace(".", ",") +
        "%0A%0ANome:" +
        "%0AForma de pagamento:" +
        "%0AEndereço para entrega:";

    // =========================
    // ABRIR WHATSAPP
    // =========================

    window.open(
        "https://wa.me/5512981584619?text=" + mensagem,
        "_blank"
    );

});

    // =========================
    // ATUALIZAR CARRINHO
    // =========================

function atualizarCarrinho() {

    carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    listaCarrinho.innerHTML = "";

    let total = 0;

        carrinho.forEach(item => {

            const preco = parseFloat(
                item.preco
                    .replace("R$", "")
                    .replace(",", ".")
            );

            total += preco * item.quantidade;

            listaCarrinho.innerHTML += `

<div class="item-carrinho">
    <h4>${item.nome}</h4>
    <p>${item.marca}</p>

    ${item.variacao ? `<small class="variacao-carrinho">${item.variacao}</small>` : ""}

    <div class="quantidade">

                        <button class="menos">−</button>

                        <span>${item.quantidade}</span>

                        <button class="mais">+</button>

                    </div>

                    <div class="acoes-carrinho">

                        <strong>${item.preco}</strong>

                        <button
                            class="remover"
                            title="Remover produto"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

            `;

        });


        totalCarrinho.textContent =
            "R$ " + total.toFixed(2).replace(".", ",");


        // =========================
        // BOTÃO +
        // =========================

        document.querySelectorAll(".mais").forEach((botao, indice) => {

            botao.addEventListener("click", () => {

                carrinho[indice].quantidade++;

                contador.textContent = carrinho.reduce(
                    (total, item) => total + item.quantidade,
                    0
                );

                salvarCarrinho();

                atualizarCarrinho();

            });

        });


        // =========================
        // BOTÃO -
        // =========================

        document.querySelectorAll(".menos").forEach((botao, indice) => {

            botao.addEventListener("click", () => {

                carrinho[indice].quantidade--;

                if (carrinho[indice].quantidade <= 0) {

                    carrinho.splice(indice, 1);

                }

                contador.textContent = carrinho.reduce(
                    (total, item) => total + item.quantidade,
                    0
                );

                salvarCarrinho();

                atualizarCarrinho();

            });

        });


        // =========================
        // REMOVER PRODUTO
        // =========================

        document.querySelectorAll(".remover").forEach((botao, indice) => {

            botao.addEventListener("click", () => {

                carrinho.splice(indice, 1);

                contador.textContent = carrinho.reduce(
                    (total, item) => total + item.quantidade,
                    0
                );

                salvarCarrinho();

                atualizarCarrinho();

            });

        });

    }


    // =========================
    // BUSCA DE PRODUTOS
    // =========================

  const campoBusca = document.querySelector("#campo-busca");
  
  campoBusca.value = "";
campoBusca.removeAttribute("value");

function limparBuscaRestaurada() {
    if (
        campoBusca &&
        campoBusca.value.includes("@")
    ) {
        campoBusca.value = "";
    }
}

window.addEventListener("load", () => {
    setTimeout(limparBuscaRestaurada, 300);
});

window.addEventListener("pageshow", () => {
    setTimeout(limparBuscaRestaurada, 300);

});
const botaoBusca = document.querySelector(".pesquisa button");

function realizarBusca() {

    const termoOriginal = campoBusca.value.trim();

    const termo = termoOriginal
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const produtos = document.querySelectorAll(".produto");

    // Se a pesquisa estiver vazia, mostra todos
    if (termo === "") {

        produtos.forEach(produto => {
            produto.style.display = "flex";
        });

        return;
    }

    let encontrou = false;

    produtos.forEach(produto => {

        const textoProduto = produto.textContent
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (textoProduto.includes(termo)) {

            produto.style.display = "flex";
            encontrou = true;

        } else {

            produto.style.display = "none";

        }

    });

    if (encontrou) {

        const secaoPromocoes =
            document.querySelector("#promocoes");

        const posicao =
            secaoPromocoes.getBoundingClientRect().top +
            window.pageYOffset -
            100;

        window.scrollTo({
            top: posicao,
            behavior: "smooth"
        });

    } else {

        alert("Produto não encontrado.");

    }
}
// =========================
// FILTRO DE CATEGORIAS
// =========================

const categorias = document.querySelectorAll(".card-categoria[data-filtro], .card-premier[data-filtro]");

categorias.forEach(categoria => {

    categoria.addEventListener("click", (e) => {

        e.preventDefault();

        const filtro = categoria.dataset.filtro;
        const marcaFiltro = categoria.dataset.marca?.toLowerCase();

        const produtos = document.querySelectorAll("#catalogo .produto");

        let encontrou = false;

        produtos.forEach(produto => {

            const tipoProduto = produto.dataset.tipo?.toLowerCase();
            const marcaProduto = produto.querySelector(".marca")?.textContent.trim().toLowerCase();

            let mostrar = false;

            // CARD DE UMA MARCA ESPECÍFICA
            if (marcaFiltro) {

                if (
                    tipoProduto === filtro &&
                    marcaProduto === marcaFiltro
                ) {
                    mostrar = true;
                }

            } else {

                // FILTRO NORMAL DE CATEGORIA
                if (
                    produto.dataset.categoria === filtro ||
                    tipoProduto === filtro
                ) {
                    mostrar = true;
                }

            }

            if (mostrar) {
                produto.style.display = "flex";
                encontrou = true;
            } else {
                produto.style.display = "none";
            }

        });

        if (encontrou) {

            const secaoCatalogo = document.querySelector("#catalogo");

            const posicao =
                secaoCatalogo.getBoundingClientRect().top +
                window.pageYOffset -
                100;

            window.scrollTo({
                top: posicao,
                behavior: "smooth"
            });

        } else {

            alert("Filtro: " + filtro + " | Marca: " + marcaFiltro);

        }

    });

});

// ===========================
// FILTRO SPECIAL DOG
// ===========================

const cardsSpecialDog = document.querySelectorAll(".card-special-dog");

cardsSpecialDog.forEach(card => {

    card.addEventListener("click", () => {

        const tipo = card.dataset.tipo;

        const produtos = document.querySelectorAll(".produto");

        produtos.forEach(produto => {

            const tipoProduto = produto.dataset.tipo;

            if (tipoProduto === tipo) {
                produto.style.display = "flex";
            } else {
                produto.style.display = "none";
            }

        });

        document.querySelector("#catalogo").scrollIntoView({
            behavior: "smooth"
        });

    });

});

// =========================
// FILTRO POR MARCA
// =========================

const botoesMarca = document.querySelectorAll("a[data-marca]");

botoesMarca.forEach(botao => {

    botao.addEventListener("click", (e) => {

        e.preventDefault();

        const marca = botao.dataset.marca.toLowerCase();
        const produtos = document.querySelectorAll(".produto");

        let encontrou = false;

        produtos.forEach(produto => {

            const marcaProduto =
                produto.querySelector(".marca")?.textContent
                .trim()
                .toLowerCase();

            if (marcaProduto === marca) {

                produto.style.display = "flex";
                encontrou = true;

            } else {

                produto.style.display = "none";

            }

        });

        if (encontrou) {

            const secaoPromocoes =
                 document.querySelector("#catalogo");

            const posicao =
                secaoPromocoes.getBoundingClientRect().top +
                window.pageYOffset -
                100;

            window.scrollTo({
                top: posicao,
                behavior: "smooth"
            });

        } else {

            alert("Ainda não temos produtos dessa marca cadastrados.");

        }

    });

});
    // =========================
    // BOTÃO DE PESQUISA
    // =========================

    botaoBusca.addEventListener(
        "click",
        realizarBusca
    );


    // =========================
    // ENTER NA PESQUISA
    // =========================

    campoBusca.addEventListener(
        "keydown",
        (e) => {

            if (e.key === "Enter") {

                realizarBusca();

            }

        }
    );
    campoBusca.addEventListener("input", () => {
    if (campoBusca.value.trim() === "") {
        document.querySelectorAll(".produto").forEach(produto => {
            produto.style.display = "flex";
        });
    }
});


    // =========================
    // INICIAR
    // =========================

contador.textContent = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
);

atualizarCarrinho();

});
// =========================
// MODAL DA CONTA
// =========================

const btnConta = document.getElementById("btn-conta");
console.log("BOTÃO CONTA:", btnConta);
console.log("MODAL CONTA:", document.getElementById("modal-conta"));
const modalConta = document.getElementById("modal-conta");
const fecharConta = document.getElementById("fechar-conta");

fecharConta.addEventListener("click", function () {
    modalConta.classList.remove("ativo");
});

modalConta.addEventListener("click", function (e) {
    if (e.target === modalConta) {
        modalConta.classList.remove("ativo");
    }
});
// =========================
// MODAL DE LOGIN
// =========================

const btnEntrarConta = document.getElementById("btn-entrar-conta");
const modalLogin = document.getElementById("modal-login");
const fecharLogin = document.getElementById("fechar-login");
const voltarConta = document.getElementById("voltar-conta");
const esqueciSenha = document.getElementById("esqueci-senha");
const modalEsqueciSenha = document.getElementById("modal-esqueci-senha");
const fecharEsqueciSenha = document.getElementById("fechar-esqueci-senha");
const voltarLoginRecuperacao = document.getElementById("voltar-login-recuperacao");
const enviarRecuperacao = document.getElementById("enviar-recuperacao");
esqueciSenha.addEventListener("click", function () {

    modalLogin.classList.remove("ativo");
    modalEsqueciSenha.classList.add("ativo");

    const emailLogin = document.getElementById("login-email").value.trim();

    if (emailLogin) {
        document.getElementById("recuperar-email").value = emailLogin;
    }

});
voltarLoginRecuperacao.addEventListener("click", function () {

    modalEsqueciSenha.classList.remove("ativo");
    modalLogin.classList.add("ativo");

});
fecharEsqueciSenha.addEventListener("click", function () {

    modalEsqueciSenha.classList.remove("ativo");

});
enviarRecuperacao.addEventListener("click", async function () {

    const email = document
        .getElementById("recuperar-email")
        .value
        .trim();

    if (!email) {

        mostrarMensagem(
            "Informe seu e-mail",
            "Digite o e-mail usado na sua conta.",
            "!"
        );

        return;
    }

    const { error } =
        await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });

    if (error) {

        console.error(error);

        mostrarMensagem(
            "Não foi possível enviar",
            "Não conseguimos enviar o link de recuperação. Tente novamente.",
            "!"
        );

        return;
    }

    modalEsqueciSenha.classList.remove("ativo");

    mostrarMensagem(
        "E-mail enviado!",
        "Verifique sua caixa de entrada e clique no link para criar uma nova senha.",
        "✓"
    );

});

// Abrir tela de login
btnEntrarConta.addEventListener("click", function () {
    modalConta.classList.remove("ativo");
    modalLogin.classList.add("ativo");
});

// Fechar pelo X
fecharLogin.addEventListener("click", function () {
    modalLogin.classList.remove("ativo");
});

// Voltar para Minha Conta
voltarConta.addEventListener("click", function () {
    modalLogin.classList.remove("ativo");
    modalConta.classList.add("ativo");
});

// Fechar clicando fora
modalLogin.addEventListener("click", function (e) {
    if (e.target === modalLogin) {
        modalLogin.classList.remove("ativo");
    }
});
// =========================
// MODAL DE CADASTRO
// =========================

const btnCriarConta = document.getElementById("btn-criar-conta");
const modalCadastro = document.getElementById("modal-cadastro");
const fecharCadastro = document.getElementById("fechar-cadastro");
const voltarLogin = document.getElementById("voltar-login");

// Abrir cadastro
btnCriarConta.addEventListener("click", function () {
    modalConta.classList.remove("ativo");
    modalCadastro.classList.add("ativo");
});

// Fechar pelo X
fecharCadastro.addEventListener("click", function () {
    modalCadastro.classList.remove("ativo");
});

// Voltar para login
voltarLogin.addEventListener("click", function () {
    modalCadastro.classList.remove("ativo");
    modalLogin.classList.add("ativo");
});

// Fechar clicando fora
modalCadastro.addEventListener("click", function (e) {
    if (e.target === modalCadastro) {
        modalCadastro.classList.remove("ativo");
    }
});
// =========================
// CADASTRO DE CLIENTE
// =========================

const confirmarCadastro = document.getElementById("confirmar-cadastro");

// =========================
// CADASTRO REAL NO SUPABASE
// =========================

confirmarCadastro.addEventListener("click", async function () {

    const nome = document.getElementById("cadastro-nome").value.trim();
    const email = document.getElementById("cadastro-email").value.trim();
    const senha = document.getElementById("cadastro-senha").value;
    const confirmarSenha = document.getElementById("cadastro-confirmar-senha").value;

    if (!nome || !email || !senha || !confirmarSenha) {
        mostrarMensagem(
    "Preencha os campos",
    "Informe todos os dados para criar sua conta.",
    "!"
);
        return;
    }

    if (senha !== confirmarSenha) {
        mostrarMensagem(
    "Senhas diferentes",
    "As duas senhas precisam ser iguais.",
    "!"
);
        return;
    }

    if (senha.length < 6) {
        mostrarMensagem(
    "Senha muito curta",
    "Sua senha precisa ter pelo menos 6 caracteres.",
    "!"
);
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: senha,
        options: {
            data: {
                nome: nome
            }
        }
    });

    if (error) {
        console.error(error);
        mostrarMensagem(
    "Não foi possível criar a conta",
    "Ocorreu um problema ao criar sua conta. Tente novamente.",
    "!"
);
        return;
    }

    mostrarMensagem(
    "Conta criada!",
    "Sua conta foi criada com sucesso.",
    "✓"
);

    document.getElementById("cadastro-nome").value = "";
    document.getElementById("cadastro-email").value = "";
    document.getElementById("cadastro-senha").value = "";
    document.getElementById("cadastro-confirmar-senha").value = "";

    modalCadastro.classList.remove("ativo");
});

// =========================
// VOLTAR DO CADASTRO
// =========================

const voltarLoginCadastro = document.getElementById("voltar-login");

voltarLoginCadastro.addEventListener("click", function () {
    modalCadastro.classList.remove("ativo");
    modalLogin.classList.add("ativo");
});
// =========================
// LOGIN REAL NO SUPABASE
// =========================

const confirmarLogin = document.getElementById("confirmar-login");

confirmarLogin.addEventListener("click", async function () {

    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value;

    if (!email || !senha) {
        mostrarMensagem(
    "Campos incompletos",
    "Preencha seu e-mail e sua senha para entrar.",
    "!"
);
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        console.error(error);
        mostrarMensagem(
    "Não foi possível entrar",
    "Verifique seu e-mail e sua senha e tente novamente.",
    "!"
);
        return;
    }

    mostrarMensagem(
    "Login realizado!",
    "Bem-vindo de volta à Crocodilo Rações.",
    "✓"
);

    modalLogin.classList.remove("ativo");

    console.log("Usuário logado:", data.user);
});
// =========================================
// MENSAGENS PERSONALIZADAS DO SITE
// =========================================

function mostrarMensagem(titulo, texto, icone = "✓") {

    const mensagemExistente = document.querySelector(".mensagem-site");

    if (mensagemExistente) {
        mensagemExistente.remove();
    }

    const mensagem = document.createElement("div");

    mensagem.className = "mensagem-site";

    mensagem.innerHTML = `
        <div class="mensagem-conteudo">

            <div class="mensagem-icone">
                ${icone}
            </div>

            <h3>${titulo}</h3>

            <p>${texto}</p>

            <button type="button" class="fechar-mensagem">
                Continuar
            </button>

        </div>
    `;

    document.body.appendChild(mensagem);

    const fechar = mensagem.querySelector(".fechar-mensagem");

    fechar.addEventListener("click", () => {
        mensagem.remove();
    });

    mensagem.addEventListener("click", (e) => {
        if (e.target === mensagem) {
            mensagem.remove();
        }
    });
}
// =========================================
// CONTA DO CLIENTE
// =========================================

async function abrirContaCliente() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    const conteudo = modalConta.querySelector(".conteudo-conta");

    if (!user) {

        conteudo.innerHTML = `
            <button id="fechar-conta-novo" class="fechar-conta">&times;</button>

            <div class="icone-conta">
                <i class="fa-regular fa-user"></i>
            </div>

            <h2>Minha Conta</h2>

            <p>Entre ou crie sua conta para continuar.</p>

            <button id="btn-entrar-conta-novo" class="botao-conta">
                Entrar
            </button>

            <button id="btn-criar-conta-novo" class="botao-conta secundario">
                Criar minha conta
            </button>
        `;

        document
            .getElementById("fechar-conta-novo")
            .addEventListener("click", () => {
                modalConta.classList.remove("ativo");
            });

        document
            .getElementById("btn-entrar-conta-novo")
            .addEventListener("click", () => {
                modalConta.classList.remove("ativo");
                modalLogin.classList.add("ativo");
            });

        document
            .getElementById("btn-criar-conta-novo")
            .addEventListener("click", () => {
                modalConta.classList.remove("ativo");
                modalCadastro.classList.add("ativo");
            });

        return;
    }


    // =========================================
    // CLIENTE LOGADO
    // =========================================

    const nome = user.user_metadata?.nome || "Cliente";
    const email = user.email || "";

    conteudo.innerHTML = `
        <button id="fechar-conta-logado" class="fechar-conta">&times;</button>

        <div class="icone-conta conta-logada-icone">
            <i class="fa-solid fa-user"></i>
        </div>

        <h2>Olá, ${nome}!</h2>

        <p class="email-cliente">
            ${email}
        </p>

        <div class="opcoes-conta">

            <button id="btn-meus-pedidos" class="opcao-conta">
                <span class="opcao-icone">
                    <i class="fa-solid fa-box"></i>
                </span>

                <span>
                    <strong>Meus pedidos</strong>
                    <small>Veja suas compras</small>
                </span>

                <i class="fa-solid fa-chevron-right seta-conta"></i>
            </button>


            <button id="btn-meus-favoritos" class="opcao-conta">
                <span class="opcao-icone">
                    <i class="fa-regular fa-heart"></i>
                </span>

                <span>
                    <strong>Meus favoritos</strong>
                    <small>Produtos que você salvou</small>
                </span>

                <i class="fa-solid fa-chevron-right seta-conta"></i>
            </button>


            <button id="btn-sair-conta" class="opcao-conta opcao-sair">
                <span class="opcao-icone">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </span>

                <span>
                    <strong>Sair da conta</strong>
                    <small>Encerrar sua sessão</small>
                </span>

                <i class="fa-solid fa-chevron-right seta-conta"></i>
            </button>

        </div>
    `;


    // FECHAR

    document
        .getElementById("fechar-conta-logado")
        .addEventListener("click", () => {
            modalConta.classList.remove("ativo");
        });


    // MEUS PEDIDOS

    document
        .getElementById("btn-meus-pedidos")
        .addEventListener("click", () => {

    abrirMeusPedidos();

        });


    // FAVORITOS

 // FAVORITOS

document
    .getElementById("btn-meus-favoritos")
    .addEventListener("click", () => {

        abrirMeusFavoritos();

    });


    // SAIR

    document
        .getElementById("btn-sair-conta")
        .addEventListener("click", async () => {

            const { error } = await supabaseClient.auth.signOut();

            if (error) {

                mostrarMensagem(
                    "Não foi possível sair",
                    "Tente novamente.",
                    "!"
                );

                return;
            }

            modalConta.classList.remove("ativo");

            btnConta.innerHTML = `
                <i class="fa-regular fa-user"></i>
                Conta
            `;

            mostrarMensagem(
                "Você saiu da conta",
                "Até a próxima!",
                "✓"
            );

        });
}


// =========================================
// BOTÃO CONTA
// =========================================

btnConta.addEventListener("click", async function (e) {

    e.preventDefault();

    modalConta.classList.add("ativo");

    await abrirContaCliente();

});


// =========================================
// ATUALIZAR NOME NO TOPO
// =========================================

async function atualizarNomeConta() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {

        btnConta.innerHTML = `
            <i class="fa-regular fa-user"></i>
            Conta
        `;

        return;
    }

    const nome = user.user_metadata?.nome || "Conta";

    btnConta.innerHTML = `
        <i class="fa-regular fa-user"></i>
        ${nome}
    `;
}


// Verificar ao carregar
atualizarNomeConta();


// Atualizar quando o login mudar
supabaseClient.auth.onAuthStateChange(() => {

    atualizarNomeConta();

});

// =========================================
// ATUALIZAR CONTA QUANDO O LOGIN MUDAR
// =========================================

// =========================================
// MEUS PEDIDOS
// =========================================

async function abrirMeusPedidos() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        return;
    }

    const { data: pedidos, error } = await supabaseClient
        .from("pedidos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Erro ao buscar pedidos:", error);

        mostrarMensagem(
            "Erro",
            "Não foi possível carregar seus pedidos.",
            "!"
        );

        return;
    }


    // Cria o modal

    const modalPedidos = document.createElement("div");

    modalPedidos.className = "modal-conta";
    modalPedidos.classList.add("ativo");
    // AGRUPAR PRODUTOS PELO MESMO PEDIDO
const pedidosAgrupados = Object.values(
    pedidos.reduce((grupos, pedido) => {

        // Pedidos antigos sem pedido_id ficam separados
        const chave = pedido.pedido_id || `antigo-${pedido.id}`;

        if (!grupos[chave]) {
            grupos[chave] = {
                pedido_id: pedido.pedido_id,
                status: pedido.status,
                created_at: pedido.created_at,
                produtos: []
            };
        }

        grupos[chave].produtos.push(pedido);

        return grupos;

    }, {})
);

    modalPedidos.innerHTML = `

        <div class="conteudo-conta modal-pedidos">

            <button class="fechar-conta fechar-pedidos">
                &times;
            </button>

            <div class="icone-conta">
                <i class="fa-solid fa-box"></i>
            </div>

            <h2>Meus pedidos</h2>

            ${
                pedidos.length === 0

                ? `

                    <div class="pedidos-vazio">

                        <i class="fa-solid fa-box-open"></i>

                        <h3>Nenhum pedido ainda</h3>

                        <p>
                            Quando você fizer uma compra,
                            ela aparecerá aqui.
                        </p>

                    </div>

                `

                :

                `

                    <div class="lista-pedidos">

${pedidosAgrupados.map((grupo, index) => {

    const totalPedido = grupo.produtos.reduce(
        (total, produto) => total + Number(produto.valor || 0),
        0
    );

    return `
        <div class="pedido-card">

            <div class="pedido-topo">

                <strong>
                    Pedido #${index + 1}
                </strong>

                <span>
                    ${grupo.status}
                </span>

            </div>

            <div class="pedido-produtos">

                ${grupo.produtos.map(produto => `

                    <div class="pedido-produto">

                        <strong>
                            ${produto.produto}
                        </strong>

                        ${
                            produto.variacao
                                ? `<small>${produto.variacao}</small>`
                                : ""
                        }

                        <small>
                            Quantidade: ${produto.quantidade}
                        </small>

                        <strong class="pedido-produto-valor">
                            R$ ${Number(produto.valor || 0)
                                .toFixed(2)
                                .replace(".", ",")}
                        </strong>

                    </div>

                `).join("")}

            </div>

            <div class="pedido-rodape">

                <span>
                    ${new Date(grupo.created_at)
                        .toLocaleDateString("pt-BR")}
                </span>

                <strong>
                    Total: R$ ${totalPedido
                        .toFixed(2)
                        .replace(".", ",")}
                </strong>

            </div>
            <button class="comprar-novamente" type="button">
    <i class="fa-solid fa-cart-shopping"></i>
    Comprar novamente
</button>

        </div>
    `;

}).join("")}

                    </div>

                `
            }

            <button class="botao-conta fechar-pedidos-btn">
                Voltar
            </button>

        </div>

    `;

    document.body.appendChild(modalPedidos);
// =========================
// COMPRAR NOVAMENTE
// =========================

document
    .querySelectorAll(".comprar-novamente")
    .forEach((botao, index) => {

        botao.addEventListener("click", () => {

            const grupo = pedidosAgrupados[index];

            let carrinhoAtual =
                JSON.parse(localStorage.getItem("carrinho")) || [];

            grupo.produtos.forEach(produto => {

                const existente = carrinhoAtual.find(
                    item => item.nome === produto.produto
                );

                if (existente) {

                    existente.quantidade += Number(
                        produto.quantidade
                    );

                } else {

                    const precoUnitario =
                        Number(produto.valor) /
                        Number(produto.quantidade);

                    carrinhoAtual.push({
                        nome: produto.produto,
                        marca: "",
                        preco: `R$ ${precoUnitario
                            .toFixed(2)
                            .replace(".", ",")}`,
                        quantidade: Number(produto.quantidade)
                    });
                }
            });

            // Salva o carrinho
            localStorage.setItem(
                "carrinho",
                JSON.stringify(carrinhoAtual)
            );

            // Atualiza a variável do carrinho
            carrinho = carrinhoAtual;
            
            const contadorCarrinho = document.getElementById("contador-carrinho");

if (contadorCarrinho) {
    contadorCarrinho.textContent = carrinho.reduce(
        (total, item) => total + Number(item.quantidade),
        0
    );
}

// Fecha Meus pedidos
modalPedidos.remove();

// Fecha a conta
modalConta.classList.remove("ativo");

// Abre o carrinho pelo botão oficial
document.querySelector("#btn-carrinho").click();

        });

    });

    // Fechar no X

    modalPedidos
        .querySelector(".fechar-pedidos")
        .addEventListener("click", () => {

            modalPedidos.remove();

        });


    // Fechar no botão voltar

    modalPedidos
        .querySelector(".fechar-pedidos-btn")
        .addEventListener("click", () => {

            modalPedidos.remove();

        });

}
// =========================================
// FAVORITOS
// =========================================

async function obterFavoritosUsuario() {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {
        return {
            user: null,
            favoritos: [],
            error: null
        };
    }

    const { data: favoritos, error } =
        await supabaseClient
            .from("favoritos")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

    return {
        user,
        favoritos: favoritos || [],
        error
    };
}


// =========================================
// VISUAL DO CORAÇÃO
// =========================================

function atualizarVisualCoracao(botao, favorito) {

    const icone = botao.querySelector("i");

    if (!icone) return;

    icone.className = favorito
        ? "fa-solid fa-heart"
        : "fa-regular fa-heart";

    botao.classList.toggle("favoritado", favorito);

    botao.setAttribute(
        "aria-label",
        favorito
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
    );

    botao.setAttribute(
        "title",
        favorito
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
    );
}


// =========================================
// ADICIONAR / REMOVER FAVORITO
// =========================================

async function alternarFavorito(produto, botao) {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {

        mostrarMensagem(
            "Entre na sua conta",
            "Faça login para salvar produtos nos seus favoritos.",
            "♥"
        );

        return;
    }

    const nome =
        produto.querySelector("h3")?.textContent.trim();

    const marca =
        produto.querySelector(".marca")?.textContent.trim() || "";

    const precoTexto =
        produto.querySelector(".preco")?.textContent.trim()
        || "R$ 0,00";

    const imagem =
        produto.querySelector(".foto img")?.getAttribute("src")
        || "";

    if (!nome) return;


    // Verificar se já existe
    const { data: existente, error: buscaError } =
        await supabaseClient
            .from("favoritos")
            .select("id")
            .eq("user_id", user.id)
            .eq("produto", nome)
            .maybeSingle();


    if (buscaError) {

        console.error(
            "Erro ao verificar favorito:",
            buscaError
        );

        mostrarMensagem(
            "Erro",
            "Não foi possível verificar esse favorito.",
            "!"
        );

        return;
    }


    // REMOVER
    if (existente) {

        const { error } =
            await supabaseClient
                .from("favoritos")
                .delete()
                .eq("id", existente.id)
                .eq("user_id", user.id);

        if (error) {

            console.error(
                "Erro ao remover favorito:",
                error
            );

            mostrarMensagem(
                "Erro",
                "Não foi possível remover o produto dos favoritos.",
                "!"
            );

            return;
        }

        atualizarVisualCoracao(
            botao,
            false
        );

        return;
    }


    // CONVERTER PREÇO
    const preco =
        parseFloat(
            precoTexto
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        ) || 0;


    // SALVAR
    const { error } =
        await supabaseClient
            .from("favoritos")
            .insert({
                user_id: user.id,
                produto: nome,
                marca: marca,
                preco: preco,
                imagem: imagem
            });


    if (error) {

        console.error(
            "Erro ao salvar favorito:",
            error
        );

        mostrarMensagem(
            "Erro",
            "Não foi possível salvar o produto nos favoritos.",
            "!"
        );

        return;
    }


    atualizarVisualCoracao(
        botao,
        true
    );

    mostrarMensagem(
        "Adicionado aos favoritos",
        "Você poderá encontrar esse produto em Meus favoritos.",
        "♥"
    );
}


// =========================================
// CRIAR CORAÇÕES NOS PRODUTOS
// =========================================

function inicializarBotoesFavoritos() {

    document
        .querySelectorAll(".produto")
        .forEach(produto => {

            if (
                produto.querySelector(".botao-favorito")
            ) {
                return;
            }

            produto.style.position = "relative";


            const botao =
                document.createElement("button");

            botao.type = "button";

            botao.className =
                "botao-favorito";

            botao.innerHTML =
                '<i class="fa-regular fa-heart"></i>';

            botao.setAttribute(
                "aria-label",
                "Adicionar aos favoritos"
            );

            botao.setAttribute(
                "title",
                "Adicionar aos favoritos"
            );


            botao.addEventListener(
                "click",
                async e => {

                    e.preventDefault();
                    e.stopPropagation();

                    await alternarFavorito(
                        produto,
                        botao
                    );

                }
            );


            produto.appendChild(botao);

        });


    carregarEstadoDosFavoritos();
}


// =========================================
// CARREGAR FAVORITOS SALVOS
// =========================================

async function carregarEstadoDosFavoritos() {

    const {
        user,
        favoritos,
        error
    } = await obterFavoritosUsuario();

    if (!user || error) return;


    document
        .querySelectorAll(".produto")
        .forEach(produto => {

            const nome =
                produto
                    .querySelector("h3")
                    ?.textContent
                    .trim();

            const botao =
                produto.querySelector(
                    ".botao-favorito"
                );

            if (!nome || !botao) return;


            const favorito =
                favoritos.some(
                    f => f.produto === nome
                );


            atualizarVisualCoracao(
                botao,
                favorito
            );

        });
}


// =========================================
// ABRIR MEUS FAVORITOS
// =========================================

async function abrirMeusFavoritos() {

    const {
        user,
        favoritos,
        error
    } = await obterFavoritosUsuario();


    if (!user) {

        mostrarMensagem(
            "Entre na sua conta",
            "Faça login para acessar seus favoritos.",
            "♥"
        );

        return;
    }


    if (error) {

        console.error(
            "Erro ao buscar favoritos:",
            error
        );

        mostrarMensagem(
            "Erro",
            "Não foi possível carregar seus favoritos.",
            "!"
        );

        return;
    }


    const modalFavoritos =
        document.createElement("div");

    modalFavoritos.className =
        "modal-conta ativo";


    modalFavoritos.innerHTML = `

        <div class="conteudo-conta modal-favoritos">

            <button
                class="fechar-conta fechar-favoritos">
                &times;
            </button>

            <div class="icone-conta">
                <i class="fa-solid fa-heart"></i>
            </div>

            <h2>Meus favoritos</h2>

            <p class="subtitulo-favoritos">
                Produtos que você salvou para comprar depois.
            </p>


            ${
                favoritos.length === 0

                ?

                `
                <div class="favoritos-vazio">

                    <i class="fa-regular fa-heart"></i>

                    <h3>
                        Nenhum favorito ainda
                    </h3>

                    <p>
                        Clique no coração dos produtos
                        que você quer guardar.
                    </p>

                </div>
                `

                :

                `
                <div class="lista-favoritos">

                    ${
                        favoritos.map(f => `

                            <div
                                class="favorito-card"
                                data-id="${f.id}"
                            >

                                <div class="favorito-imagem">

                                    <img
                                        src="${f.imagem || ""}"
                                        alt="${f.produto}"
                                    >

                                </div>


                                <div class="favorito-info">

                                    <strong>
                                        ${f.produto}
                                    </strong>

                                    <small>
                                        ${f.marca || ""}
                                    </small>

                                    <span>
                                        R$
                                        ${Number(f.preco || 0)
                                            .toFixed(2)
                                            .replace(".", ",")}
                                    </span>


                                    <div class="favorito-acoes">

                                        <button
                                            type="button"
                                            class="favorito-comprar"
                                            data-nome="${f.produto}"
                                        >
                                            Comprar
                                        </button>

                                        <button
                                            type="button"
                                            class="favorito-remover"
                                            data-id="${f.id}"
                                        >
                                            <i class="fa-solid fa-trash"></i>
                                        </button>

                                    </div>

                                </div>

                            </div>

                        `).join("")
                    }

                </div>
                `
            }


            <button
                type="button"
                class="botao-conta fechar-favoritos-btn">
                Voltar
            </button>

        </div>
    `;


    document.body.appendChild(
        modalFavoritos
    );


    modalFavoritos
        .querySelector(".fechar-favoritos")
        .addEventListener(
            "click",
            () => modalFavoritos.remove()
        );


    modalFavoritos
        .querySelector(".fechar-favoritos-btn")
        .addEventListener(
            "click",
            () => modalFavoritos.remove()
        );


    // REMOVER
    modalFavoritos
        .querySelectorAll(".favorito-remover")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                async () => {

                    const id =
                        botao.dataset.id;

                    const {
                        data: { user }
                    } =
                        await supabaseClient.auth.getUser();


                    if (!user) return;


                    const { error } =
                        await supabaseClient
                            .from("favoritos")
                            .delete()
                            .eq("id", id)
                            .eq("user_id", user.id);


                    if (error) {

                        mostrarMensagem(
                            "Erro",
                            "Não foi possível remover o favorito.",
                            "!"
                        );

                        return;
                    }


                    modalFavoritos.remove();

                    abrirMeusFavoritos();

                    carregarEstadoDosFavoritos();

                }
            );

        });


    // COMPRAR
    modalFavoritos
        .querySelectorAll(".favorito-comprar")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    const nome =
                        botao.dataset.nome;

                    const produto =
                        [...document.querySelectorAll(".produto")]
                            .find(
                                item =>
                                    item.querySelector("h3")
                                        ?.textContent
                                        .trim()
                                    === nome
                            );


                    if (!produto) {

                        mostrarMensagem(
                            "Produto indisponível",
                            "Esse produto não está disponível no catálogo atual.",
                            "!"
                        );

                        return;
                    }


                    produto
                        .querySelector(".btn-comprar")
                        ?.click();

                    modalFavoritos.remove();

                }
            );

        });

}


// =========================================
// INICIAR FAVORITOS
// =========================================

inicializarBotoesFavoritos();

supabaseClient.auth.onAuthStateChange(
    () => {

        setTimeout(
            inicializarBotoesFavoritos,
            0
        );

    }
);
// =========================================
// RECUPERAÇÃO DE SENHA - NOVA SENHA
// =========================================

const modalNovaSenha = document.getElementById("modal-nova-senha");
const salvarNovaSenha = document.getElementById("salvar-nova-senha");

salvarNovaSenha.addEventListener("click", async function () {

    const novaSenha =
        document.getElementById("nova-senha").value;

    const confirmarNovaSenha =
        document.getElementById("confirmar-nova-senha").value;

    if (!novaSenha || !confirmarNovaSenha) {

        mostrarMensagem(
            "Preencha os campos",
            "Digite e confirme sua nova senha.",
            "!"
        );

        return;
    }

    if (novaSenha !== confirmarNovaSenha) {

        mostrarMensagem(
            "Senhas diferentes",
            "As duas senhas precisam ser iguais.",
            "!"
        );

        return;
    }

    if (novaSenha.length < 6) {

        mostrarMensagem(
            "Senha muito curta",
            "Sua senha precisa ter pelo menos 6 caracteres.",
            "!"
        );

        return;
    }

    const { error } =
        await supabaseClient.auth.updateUser({
            password: novaSenha
        });

    if (error) {

        console.error(error);

        mostrarMensagem(
            "Não foi possível alterar",
            "Não conseguimos alterar sua senha. Tente novamente.",
            "!"
        );

        return;
    }

    modalNovaSenha.classList.remove("ativo");

    document.getElementById("nova-senha").value = "";
    document.getElementById("confirmar-nova-senha").value = "";

    mostrarMensagem(
        "Senha alterada!",
        "Sua senha foi alterada com sucesso. Agora você já pode entrar na sua conta.",
        "✓"
    );

});


// =========================================
// DETECTAR RECUPERAÇÃO DE SENHA
// =========================================

supabaseClient.auth.onAuthStateChange((event) => {

    if (event === "PASSWORD_RECOVERY") {

        modalNovaSenha.classList.add("ativo");

    }

});