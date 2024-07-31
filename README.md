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