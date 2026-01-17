# 📊 Log System Management v3 - Documentação Técnica

Este sistema é uma plataforma avançada de coleta, análise e gerenciamento de logs, integrando Inteligência Artificial para diagnósticos automáticos e notificações em tempo real.

---

## 🏗️ Arquitetura do Sistema

- **Backend**: FastAPI (Python 3.10)
- **Frontend**: React + Vite + Vanilla CSS (Aesthetics Premium)
- **Banco de Dados**: PostgreSQL (Produção) / SQLite (Desenvolvimento)
- **Containers**: Docker + Docker Compose
- **IA Local**: Ollama (Llama 3.2 1b) para classificação rápida.
- **IA Nuvem**: OpenAI (GPT-4o-mini) para relatórios técnicos profundos.

---

## 🚀 Como Subir o Sistema (Produção)

1. **Requisitos**: Docker e Docker Compose instalados.
2. **Configuração**: Verifique o arquivo `.env` para garantir que `OPENAI_API_KEY` e `MASTER_KEY` estão definidos.
3. **Comando Mágico**:
   ```bash
   docker compose up -d --build
   ```
4. **Migração de Dados**: Se você tiver um arquivo `logs.db` antigo:
   ```bash
   python3 migrate_to_pg.py
   ```

---

## 🌐 Configuração do Nginx (Multi-domínio)

O sistema utiliza dois subdomínios separados. O Docker expõe apenas para o `localhost` da VPS por segurança.

### 1. Frontend (`app.pbpmdev.com`)
```nginx
server {
    listen 80;
    server_name app.pbpmdev.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Backend API (`api.pbpmdev.com`)
```nginx
server {
    listen 80;
    server_name api.pbpmdev.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📡 Endpoints Principais da API

### `POST /webhook`
Recebe os logs externos.
- **Headers**: `x-api-key: <SYSTEM_ID>`
- **Body**:
  ```json
  {
    "message": "Mensagem do log ou objeto JSON",
    "level": "info|warning|erro|sucesso",
    "container": "nome_do_servico"
  }
  ```

### `GET /stats/daily`
Retorna dados agregados para os gráficos do dashboard.

### `POST /systems/register`
Registra um novo sistema (Protegido por `MASTER_KEY`).

---

## 🧠 Inteligência Artificial & Automação

1. **Classificação Instantânea**: Ao receber um log, o sistema usa o **Llama 3.2 via Ollama** para categorizar o evento. O modelo é mantido em cache (`keep_alive`) para resposta sub-segundo.
2. **Relatórios de Incidente**: Logs marcados como `erro` disparam uma tarefa em segundo plano que:
   - Consulta a **Ficha Técnica** do sistema.
   - Envia o erro + contexto para o **GPT-4o-mini**.
   - Salva o relatório no banco e envia via email ao responsável técnico.

---

## 🧹 Sistema de Filtros e Limpeza

### Filtros de Descarte
- Localizados na página de detalhes de cada sistema.
- Padrões de texto que, se encontrados, impedem que o log seja salvo.
- **Objetivo**: Reduzir ruído (ex: logs de healthcheck) e economizar custos de IA.

### Limpeza Retroativa
- Remove logs antigos que correspondam a um padrão.
- Gera um relatório consolidado enviado por email após a exclusão.

---

## 🛠️ Manutenção

- **Ver Logs dos Containers**: `docker compose logs -f`
- **Acessar Banco de Dados**: Porta `5432` (Postgres).
- **Frontend**: Porta `3002` (Interna). Acesso via Nginx.
- **Backend API**: Porta `8000` (Interna). Acesso via Nginx (`api.pbpmdev.com`).

---

© 2026 LOGS_DB - Gestão Inteligente de Infraestrutura.
