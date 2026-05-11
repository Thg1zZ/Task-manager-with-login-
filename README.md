# 🚀 TaskFlow — Task Manager Full Stack

Sistema de Gerenciamento de Tarefas com autenticação JWT.

## 🏗️ Stack

| Camada      | Tecnologia                 |
|-------------|----------------------------|
| Frontend    | HTML5 + CSS3 + JavaScript  |
| Backend     | Java 17 + Spring Boot 3.2  |
| Banco       | PostgreSQL 15+             |
| Auth        | JWT (JJWT 0.12)            |
| Segurança   | Spring Security 6          |

---

## 📁 Estrutura do Projeto

```
task-manager/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/taskmanager/
│       │   ├── TaskManagerApplication.java
│       │   ├── config/
│       │   │   └── SecurityConfig.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   └── TaskController.java
│       │   ├── dto/
│       │   │   ├── AuthResponse.java
│       │   │   ├── LoginRequest.java
│       │   │   ├── RegisterRequest.java
│       │   │   ├── TaskRequest.java
│       │   │   └── TaskResponse.java
│       │   ├── entity/
│       │   │   ├── User.java
│       │   │   └── Task.java
│       │   ├── repository/
│       │   │   ├── UserRepository.java
│       │   │   └── TaskRepository.java
│       │   ├── security/
│       │   │   ├── JwtTokenProvider.java
│       │   │   └── JwtAuthenticationFilter.java
│       │   └── service/
│       │       ├── AuthService.java
│       │       ├── TaskService.java
│       │       └── UserDetailsServiceImpl.java
│       └── resources/
│           └── application.properties
├── frontend/
│   ├── index.html        ← Login / Registro
│   ├── dashboard.html    ← Gerenciador de Tarefas
│   ├── css/style.css
│   └── js/
│       ├── auth.js
│       └── tasks.js
└── database/
    └── schema.sql
```

---

## ⚙️ Configuração e Execução

### 1. Pré-requisitos

- Java 17+
- Maven 3.8+
- PostgreSQL 15+
- Qualquer navegador moderno

---

### 2. Banco de Dados

```bash
# Acesse o PostgreSQL
psql -U postgres

# Crie o banco
CREATE DATABASE taskmanager;

# Saia e execute o schema
\q
psql -U postgres -d taskmanager -f database/schema.sql
```

---

### 3. Backend

Edite `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/taskmanager
spring.datasource.username=postgres
spring.datasource.password=SUA_SENHA_AQUI
```

Execute o backend:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

O servidor sobe em: `http://localhost:8080`

---

### 4. Frontend

Abra diretamente no navegador ou use um servidor local:

```bash
# Opção 1: VS Code Live Server (extensão)
# Clique com botão direito em index.html → "Open with Live Server"

# Opção 2: Python
cd frontend
python3 -m http.server 5500

# Opção 3: Node.js
npx serve frontend
```

Acesse: `http://localhost:5500`

---

## 🔌 Endpoints da API

### Autenticação
```
POST /api/auth/register   → Criar conta
POST /api/auth/login      → Login (retorna JWT)
```

### Tarefas (requer Authorization: Bearer <token>)
```
GET    /api/tasks               → Listar todas
GET    /api/tasks?status=TODO   → Filtrar por status
GET    /api/tasks?search=texto  → Buscar por texto
GET    /api/tasks/{id}          → Buscar por ID
POST   /api/tasks               → Criar tarefa
PUT    /api/tasks/{id}          → Atualizar tarefa
PATCH  /api/tasks/{id}/status   → Atualizar apenas status
DELETE /api/tasks/{id}          → Excluir tarefa
GET    /api/tasks/stats         → Estatísticas
```

### Exemplo de Request

**POST /api/auth/login**
```json
{
  "email": "admin@teste.com",
  "password": "senha123"
}
```

**POST /api/tasks**
```json
{
  "title": "Implementar autenticação",
  "description": "Usar JWT com Spring Security",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2025-12-31"
}
```

---

## 🎨 Funcionalidades

- [x] Registro e Login com JWT
- [x] CRUD completo de tarefas
- [x] Filtro por status (A Fazer / Em Progresso / Concluída)
- [x] Busca por título e descrição
- [x] Prioridade (Alta / Média / Baixa)
- [x] Data de vencimento com aviso de atraso
- [x] Troca rápida de status pelo card
- [x] Estatísticas em tempo real
- [x] Interface responsiva (mobile)
- [x] Tema dark moderno

---

## 🔐 Segurança

- Senhas criptografadas com BCrypt
- JWT com expiração de 24h
- Spring Security com Stateless Session
- CORS configurável via `application.properties`
- Isolamento total de dados por usuário

---

## 🛠️ Usuário de Teste

Após executar o schema.sql, um usuário de teste é criado:

| Campo | Valor           |
|-------|-----------------|
| Email | admin@teste.com |
| Senha | senha123        |
