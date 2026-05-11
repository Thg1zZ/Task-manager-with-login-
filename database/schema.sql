-- ============================================================
-- Task Manager — Schema PostgreSQL v2
-- ============================================================

-- CREATE DATABASE taskmanager;

-- ============================================================
-- TABELA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    bio        VARCHAR(200),
    job_title  VARCHAR(50),
    profile_image TEXT,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- ============================================================
-- TABELA: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id         BIGSERIAL   PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    color      VARCHAR(7)  NOT NULL DEFAULT '#3b82f6',
    icon       VARCHAR(10),
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(name, user_id)
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- ============================================================
-- TABELA: tasks
-- ============================================================
DO $$ BEGIN
    CREATE TYPE task_status   AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tasks (
    id                BIGSERIAL      PRIMARY KEY,
    title             VARCHAR(200)   NOT NULL,
    description       TEXT,
    status            task_status    NOT NULL DEFAULT 'TODO',
    priority          task_priority  NOT NULL DEFAULT 'MEDIUM',
    start_date        DATE,
    end_date          DATE,
    due_date          DATE,
    estimated_minutes INTEGER,
    created_at        TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP      NOT NULL DEFAULT NOW(),
    user_id           BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id       BIGINT         REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id     ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE;
UPDATE tasks SET end_date = due_date WHERE end_date IS NULL AND due_date IS NOT NULL;

-- ============================================================
-- TABELA: task_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS task_comments (
    id         BIGSERIAL  PRIMARY KEY,
    content    TEXT       NOT NULL,
    created_at TIMESTAMP  NOT NULL DEFAULT NOW(),
    task_id    BIGINT     NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id    BIGINT     NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON task_comments(task_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DADOS DE EXEMPLO
-- ============================================================
-- Senha: "senha123"
INSERT INTO users (name, email, password, bio, job_title) VALUES
    ('Admin Teste', 'admin@teste.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Usuário de demonstração do TaskFlow', 'Desenvolvedor')
ON CONFLICT (email) DO NOTHING;

-- A aplicação também atualiza este usuário no boot para garantir a senha "senha123"
-- quando o banco do Render já tiver um registro antigo.
