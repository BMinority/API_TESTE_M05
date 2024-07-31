## Testar a Rota de Listagem de Categorias:

Abra o Insomnia e configure uma requisição GET 
para http://localhost:3000/api/categoria.

## Testar a Rota de Cadastro de Usuário:

Ainda no Insomnia, configure uma requisição POST para
http://localhost:3000/api/usuario
com o corpo da requisição como JSON:

{
  "nome": "José",
  "email": "jose@email.com",
  "senha": "jose"
}

## Testar a Rota de Login:

No Insomnia, configure uma requisição POST para
http://localhost:3000/api/login
com o corpo da requisição como JSON:

{
  "email": "jose@email.com",
  "senha": "jose"
}

## Testar a Rota de Redefinição de Senha:

No Insomnia, configure uma requisição PATCH para
http://localhost:3000/api/usuario/redefinir
com o corpo da requisição como JSON:

{
  "email": "jose@email.com",
  "senha_antiga": "jose",
  "senha_nova": "jose123"
}

## Testar as Rotas de Clientes:

Cadastrar um cliente: POST para
http://localhost:3000/api/cliente
com o corpo:

{
  "nome": "Maria",
  "email": "maria@email.com",
  "telefone": "123456789",
  "endereco": "Rua A, 123"
}

## Listar clientes: GET para
http://localhost:3000/api/cliente.

## Cadastrar um produto: POST para
http://localhost:3000/api/produto
com o corpo:

{
  "nome": "Notebook",
  "preco": 300000,
  "categoria_id": 1
}

## Listar produtos: GET para
http://localhost:3000/api/produto.


## Cadastrar um pedido: POST para
http://localhost:3000/api/pedido
com o corpo:

{
  "cliente_id": 1,
  "itens": [
    { "produto_id": 1, "quantidade": 2 }
  ]
}