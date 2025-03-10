Physical-Store
Descrição
"Physical-Store" é uma aplicação web para gerenciamento de lojas físicas, permitindo a busca por lojas com base em CEP e a exibição da distância entre o usuário e as lojas mais próximas.

Instalação
Para instalar e executar o projeto localmente, siga os passos abaixo:

Clone o repositório:

bash
git clone [https://github.com/seu-usuario/physical-store.git](https://github.com/igorchl/Physical-Store-Project-2.git)

cd physical-store
Instale as dependências:

bash
npm install
Inicie o servidor:

bash
npm start
Utilização
Execute o Postman: Utilize o Postman para fazer requisições à API.

Exemplo de Endpoints:

Buscar Lojas por CEP:

bash
curl -X GET "http://localhost:3000/lojas?cep=03003-000"
Solução de Problemas
Erros de Caminho de Dependência:

Caso encontre erros de caminho de dependência ao executar o projeto, siga os passos abaixo:

Remova o diretório node_modules e o arquivo package-lock.json:

bash
rm -rf node_modules
rm package-lock.json
Reinstale as dependências:

bash
npm install
Contribuição
Se deseja contribuir com o projeto, abra uma pull request ou utilize a aba de issues para sugestões e discussões.

Licença
Este projeto está licenciado sob a Licença MIT.
