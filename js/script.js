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
    // FINALIZAR PELO WHATSAPP
    // =========================

    finalizarWhatsApp.addEventListener("click", () => {

        if (carrinho.length === 0) {

            alert("Seu carrinho está vazio!");

            return;

        }

        let mensagem = "Olá! Gostaria de fazer um pedido.%0A%0A";

        let total = 0;

        carrinho.forEach(item => {

            const preco = parseFloat(
                item.preco
                    .replace("R$", "")
                    .replace(",", ".")
            );

            total += preco * item.quantidade;

            mensagem +=
                "• " + item.nome +
                "%0AQuantidade: " + item.quantidade +
                "%0APreço: " + item.preco +
                "%0A%0A";

        });

        mensagem +=
            "Total: R$ " +
            total.toFixed(2).replace(".", ",") +
            "%0A%0ANome:";

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

        const termo = campoBusca.value.trim().toLowerCase();

        if (termo === "") {

            return;

        }


        const produtos = document.querySelectorAll(".produto");

        let encontrou = false;


        produtos.forEach(produto => {

            const textoProduto =
                produto.textContent.toLowerCase();


            if (textoProduto.includes(termo)) {

                produto.scrollIntoView({

                    behavior: "smooth",

                    block: "center"

                });


                produto.style.outline =
                    "3px solid #f5b800";


                setTimeout(() => {

                    produto.style.outline = "";

                }, 2000);


                encontrou = true;

            }

        });


        if (!encontrou) {

            alert("Produto não encontrado.");

        }

    }


    // Botão de pesquisa

    botaoBusca.addEventListener(
        "click",
        realizarBusca
    );


    // Enter na pesquisa

    campoBusca.addEventListener(
        "keydown",
        (e) => {

            if (e.key === "Enter") {

                realizarBusca();

            }

        }
    );


    // =========================
    // INICIAR
    // =========================

    contador.textContent = carrinho.reduce(
        (total, item) => total + item.quantidade,
        0
    );

    atualizarCarrinho();

});