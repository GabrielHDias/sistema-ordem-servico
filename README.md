# Sistema de Ordem de Serviço

API REST em camadas (Controller, Service, Repository e Model) para uma assistência técnica. O cliente leva um equipamento, a empresa abre uma ordem de serviço, um técnico é atribuído e a ordem termina concluída ou cancelada.

O código segue o passo a passo dos slides: pacote `com.exemplo.ordemservico`, classe principal `OrdemservicoApplication`, Java 17 e Spring Boot 4.1.2.

## Como executar

Pré-requisitos: JDK 17 (ou superior), Maven e PostgreSQL escutando em `localhost:5432`.

Crie o banco e o usuário usados no `application.properties`:

```sql
CREATE DATABASE ordemservicodb;
-- usuário e senha do slide: postgres / postgres
```

A configuração fica em `src/main/resources/application.properties`:

```properties
spring.application.name=ordemservico
spring.datasource.url=jdbc:postgresql://localhost:5432/ordemservicodb
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
server.error.include-message=always
```

`ddl-auto=update` cria e atualiza as tabelas `clientes`, `tecnicos` e `ordens_servico` na subida da aplicação.

Suba a API:

```bash
mvn spring-boot:run
```

A aplicação escuta em `http://localhost:8080`. Nas requisições com corpo, envie o cabeçalho `Content-Type: application/json`.

## Endpoints

### Clientes — `/clientes`

| Método | Caminho | Sucesso | Observação |
|---|---|---|---|
| GET | `/clientes` | 200 | Lista todos |
| GET | `/clientes/{id}` | 200 | 404 se não existir |
| POST | `/clientes` | 201 | Regra 1: CPF duplicado responde 400 |
| PUT | `/clientes/{id}` | 200 | Atualiza nome, telefone e e-mail. O CPF não muda |
| DELETE | `/clientes/{id}` | 204 | 404 se não existir. Regra 9: 400 se o cliente já tiver OS |

### Técnicos — `/tecnicos`

| Método | Caminho | Sucesso | Observação |
|---|---|---|---|
| GET | `/tecnicos` | 200 | Lista todos |
| GET | `/tecnicos/{id}` | 200 | 404 se não existir |
| POST | `/tecnicos` | 201 | Sem regra de negócio |
| PUT | `/tecnicos/{id}` | 200 | Atualiza nome, especialidade e telefone |
| DELETE | `/tecnicos/{id}` | 204 | 404 se não existir |

### Ordens de serviço — `/ordens`

| Método | Caminho | Sucesso | Regras |
|---|---|---|---|
| GET | `/ordens` | 200 | nenhuma |
| GET | `/ordens?status=ABERTA` | 200 | nenhuma |
| GET | `/ordens/{id}` | 200 | nenhuma; 404 se não existir |
| GET | `/ordens/cliente/{clienteId}` | 200 | nenhuma |
| GET | `/ordens/prioridade/{prioridade}` | 200 | nenhuma |
| POST | `/ordens` | 201 | 2 e 3 |
| PUT | `/ordens/{id}/tecnico/{tecnicoId}` | 200 | 4 e 5 |
| PUT | `/ordens/{id}/concluir?valor=250.00` | 200 | 4, 6, 7 e 10 |
| PUT | `/ordens/{id}/cancelar` | 200 | 4 e 8 |

Status possíveis: `ABERTA`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA`.  
Prioridades: `BAIXA`, `MEDIA`, `ALTA`.

## Testes 6.1 a 6.10

Rode na ordem. O teste 6.6 conclui antes de atribuir o técnico, o 6.9 tenta cancelar a ordem já concluída e o 6.10 abre uma segunda ordem porque a primeira já está finalizada.

### 6.1 — POST `/clientes` (201, cliente 1)

```json
{
    "nome": "Maria Souza",
    "cpf": "123.456.789-00",
    "telefone": "(41) 99999-0000",
    "email": "maria@email.com"
}
```

### 6.2 — POST `/clientes` de novo, mesmo CPF (Regra 1)

A resposta é **400**, com a mensagem `Já existe cliente com este CPF`.

### 6.3 — POST `/tecnicos` (201, técnico 1)

```json
{
    "nome": "João Lima",
    "especialidade": "Notebooks",
    "telefone": "(41) 98888-1111"
}
```

### 6.4 — POST `/ordens` com cliente inexistente (Regra 2)

```json
{
    "descricao": "Notebook não liga",
    "prioridade": "ALTA",
    "cliente": { "id": 99 }
}
```

A resposta é **404**, `Cliente não encontrado: 99`.

### 6.5 — POST `/ordens` com o cliente 1 (Regra 3)

```json
{
    "descricao": "Notebook não liga",
    "prioridade": "ALTA",
    "cliente": { "id": 1 }
}
```

A resposta é **201**. O status vem `ABERTA`, `dataAbertura` vem preenchida com a data e hora atuais, a prioridade é `ALTA` e `tecnico` é `null`.

### 6.6 — PUT `/ordens/1/concluir?valor=250.00` (Regra 6)

Ainda não há técnico. A resposta é **400**, `Atribua um técnico antes de concluir`.

### 6.7 — PUT `/ordens/1/tecnico/1` (Regra 5)

A ordem passa para `EM_ANDAMENTO` e fica com o técnico 1.

### 6.8 — PUT `/ordens/1/concluir?valor=250.00` (Regra 7)

A ordem fica `CONCLUIDA`, com `valor` 250.00 e `dataFechamento` preenchida.

### 6.9 — PUT `/ordens/1/cancelar` (Regra 4)

A ordem já está concluída. A resposta é **400**, `A OS 1 já está CONCLUIDA`.

### 6.10 — abre a ordem 2 e cancela (Regra 8)

POST `/ordens`:

```json
{
    "descricao": "Tela quebrada",
    "prioridade": "MEDIA",
    "cliente": { "id": 1 }
}
```

Depois PUT `/ordens/2/cancelar`. A ordem fica `CANCELADA` e recebe `dataFechamento`.

## Exercícios da página 55

### Consulta por prioridade

GET `/ordens/prioridade/ALTA` devolve as ordens com essa prioridade. O valor do caminho é `BAIXA`, `MEDIA` ou `ALTA`. Não há regra de negócio: o repositório usa `findByPrioridade`.

### Regra 9 — cliente com OS não pode ser excluído

DELETE `/clientes/1`, depois que a Maria já tem uma ordem, responde **400** com a mensagem `Cliente possui ordem de serviço cadastrada`. O cliente continua no banco. Um cliente sem ordem é excluído com **204**.

### Regra 10 — valor ao concluir deve ser maior que zero

PUT `/ordens/1/concluir?valor=0` (ou sem o parâmetro `valor`, ou com valor negativo) responde **400**, `O valor deve ser maior que zero`. A ordem só é concluída quando o valor é maior que zero, como em `?valor=250.00`.
