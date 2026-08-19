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
    // BOTÕES COMPRAR
    // =========================

    botoesComprar.forEach(botao => {

        botao.addEventListener("click", () => {

            const produto = botao.closest(".produto");

            const nome = produto.querySelector("h3").textContent;

            const existente = carrinho.find(item => item.nome === nome);

            if (existente) {

                existente.quantidade++;

            } else {

                carrinho.push({

                    nome: nome,

                    marca: produto.querySelector(".marca").textContent,

                    preco: produto.querySelector(".preco").textContent,

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
        alert("Seu carrinho está vazio!");
        return;
    }

    // Verifica se o cliente está logado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {

        alert("Entre na sua conta para finalizar o pedido.");

        return;
    }

    let total = 0;

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
            produto: item.nome,
            quantidade: item.quantidade,
            valor: subtotal,
            status: "Recebido"
        };

    });


    // Salvar pedido no Supabase
    const { error } = await supabase
        .from("pedidos")
        .insert(produtosPedido);


    if (error) {

        console.error("Erro ao salvar pedido:", error);

        alert(
            "Não foi possível registrar o pedido. Tente novamente."
        );

        return;
    }


    // Montar mensagem do WhatsApp

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


    // Abrir WhatsApp

    window.open(
        "https://wa.me/5512981584619?text=" + mensagem,
        "_blank"
    );

});


    // =========================
    // ATUALIZAR CARRINHO
    // =========================

    function atualizarCarrinho() {

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

btnConta.addEventListener("click", function (e) {
    e.preventDefault();
    modalConta.classList.add("ativo");
});

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

    document
        .getElementById("btn-meus-favoritos")
        .addEventListener("click", () => {

            mostrarMensagem(
                "Meus favoritos",
                "Essa área será adicionada em breve.",
                "♥"
            );

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
// VERIFICAR LOGIN AO ABRIR O SITE
// =========================================

atualizarConta();


// =========================================
// ATUALIZAR CONTA QUANDO O LOGIN MUDAR
// =========================================

supabaseClient.auth.onAuthStateChange((event, session) => {

    atualizarConta();

});
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

                        ${pedidos.map(pedido => `

                            <div class="pedido-card">

                                <div class="pedido-topo">

                                    <strong>
                                        Pedido #${pedido.id}
                                    </strong>

                                    <span>
                                        ${pedido.status}
                                    </span>

                                </div>

                                <div class="pedido-produto">

                                    <strong>
                                        ${pedido.produto}
                                    </strong>

                                    ${
                                        pedido.variacao
                                        ? `<small>${pedido.variacao}</small>`
                                        : ""
                                    }

                                    <small>
                                        Quantidade: ${pedido.quantidade}
                                    </small>

                                </div>

                                <div class="pedido-rodape">

                                    <span>
                                        ${new Date(
                                            pedido.created_at
                                        ).toLocaleDateString("pt-BR")}
                                    </span>

                                    <strong>
                                        R$ ${Number(
                                            pedido.valor
                                        ).toFixed(2).replace(".", ",")}
                                    </strong>

                                </div>

                            </div>

                        `).join("")}

                    </div>

                `
            }

            <button class="botao-conta fechar-pedidos-btn">
                Voltar
            </button>

        </div>

    `;

    document.body.appendChild(modalPedidos);


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