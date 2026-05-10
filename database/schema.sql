-- ============================================================
-- GymScore — Schema do Banco de Dados MySQL (COMPATÍVEL)
-- ============================================================

-- =========================
-- TABELAS
-- =========================

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    CPF VARCHAR(14) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    genero ENUM('M','F','O') NOT NULL,
    saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email),
    UNIQUE KEY uq_usuarios_cpf (CPF),
    INDEX idx_usuarios_nome (nome),
    INDEX idx_usuarios_criado_em (criado_em)
);

CREATE TABLE IF NOT EXISTS desafios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL,
    local VARCHAR(200),
    status ENUM('pendente','aberto','em_andamento','encerrado') NOT NULL DEFAULT 'aberto',

    id_criador BIGINT UNSIGNED NOT NULL,
    id_desafiado BIGINT UNSIGNED,
    id_vencedor BIGINT UNSIGNED,
    id_perdedor BIGINT UNSIGNED,

    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_desafios_status (status),
    INDEX idx_desafios_id_criador (id_criador),
    INDEX idx_desafios_id_desafiado (id_desafiado),

    FOREIGN KEY (id_criador) REFERENCES usuarios(id),
    FOREIGN KEY (id_desafiado) REFERENCES usuarios(id),
    FOREIGN KEY (id_vencedor) REFERENCES usuarios(id),
    FOREIGN KEY (id_perdedor) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS amizades (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario BIGINT UNSIGNED NOT NULL,
    id_amigo BIGINT UNSIGNED NOT NULL,
    status ENUM('pendente','aceita','recusada') NOT NULL DEFAULT 'pendente',

    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_amizades_par (id_usuario, id_amigo),

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_amigo) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transacoes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario BIGINT UNSIGNED NOT NULL,
    asaas_payment_id VARCHAR(100) NOT NULL UNIQUE,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('pending','received','refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- =========================
-- FUNCTION (SEM BEGIN)
-- =========================
DROP FUNCTION IF EXISTS validar_login;

CREATE FUNCTION validar_login(
    p_email VARCHAR(150),
    p_senha VARCHAR(255)
) RETURNS TINYINT(1)
DETERMINISTIC
RETURN (
    SELECT COUNT(*) > 0
    FROM usuarios
    WHERE email = p_email AND senha = p_senha
);

-- =========================
-- PROCEDURES (ADAPTADAS)
-- =========================

DROP PROCEDURE IF EXISTS criar_usuario;
CREATE PROCEDURE criar_usuario(
    IN p_nome VARCHAR(100),
    IN p_sobrenome VARCHAR(100),
    IN p_email VARCHAR(150),
    IN p_senha VARCHAR(255),
    IN p_data_nasc DATE,
    IN p_genero ENUM('M','F','O')
)
INSERT INTO usuarios (nome, sobrenome, email, senha, data_nascimento, genero)
SELECT p_nome, p_sobrenome, p_email, p_senha, p_data_nasc, p_genero
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = p_email);

DROP PROCEDURE IF EXISTS criar_desafio;
CREATE PROCEDURE criar_desafio(
    IN p_titulo VARCHAR(200),
    IN p_id_criador BIGINT UNSIGNED,
    IN p_valor DECIMAL(10,2),
    IN p_descricao TEXT,
    IN p_local VARCHAR(200)
)
INSERT INTO desafios (titulo, id_criador, valor, descricao, local, status)
SELECT p_titulo, p_id_criador, p_valor, p_descricao, p_local, 'aberto'
WHERE (SELECT saldo FROM usuarios WHERE id = p_id_criador) >= p_valor;

DROP PROCEDURE IF EXISTS aceitar_desafio;
CREATE PROCEDURE aceitar_desafio(
    IN p_id_desafio BIGINT UNSIGNED,
    IN p_id_usuario BIGINT UNSIGNED
)
UPDATE desafios d
JOIN usuarios u ON u.id = p_id_usuario
SET d.id_desafiado = p_id_usuario,
    d.status = 'pendente'
WHERE d.id = p_id_desafio
AND d.status = 'aberto'
AND u.saldo >= d.valor;

DROP PROCEDURE IF EXISTS iniciar_desafio;
CREATE PROCEDURE iniciar_desafio(
    IN p_id_desafio BIGINT UNSIGNED
)
UPDATE desafios
SET status = 'em_andamento'
WHERE id = p_id_desafio AND status = 'pendente';

DROP PROCEDURE IF EXISTS encerrar_desafio;
CREATE PROCEDURE encerrar_desafio(
    IN p_id_desafio BIGINT UNSIGNED,
    IN p_id_vencedor BIGINT UNSIGNED,
    IN p_id_perdedor BIGINT UNSIGNED
)
UPDATE usuarios u
JOIN desafios d ON d.id = p_id_desafio
SET u.saldo = CASE
    WHEN u.id = p_id_vencedor THEN u.saldo + d.valor
    WHEN u.id = p_id_perdedor THEN u.saldo - (d.valor / 2)
    ELSE u.saldo
END;

DROP PROCEDURE IF EXISTS listar_amigos;
CREATE PROCEDURE listar_amigos(
    IN p_id_usuario BIGINT UNSIGNED
)
SELECT u.id, u.nome, u.sobrenome, u.email, a.status
FROM amizades a
JOIN usuarios u ON (
    CASE
        WHEN a.id_usuario = p_id_usuario THEN u.id = a.id_amigo
        ELSE u.id = a.id_usuario
    END
)
WHERE (a.id_usuario = p_id_usuario OR a.id_amigo = p_id_usuario)
AND a.status = 'aceita';

DROP PROCEDURE IF EXISTS adicionar_amigo;
CREATE PROCEDURE adicionar_amigo(
    IN p_id_usuario BIGINT UNSIGNED,
    IN p_id_amigo BIGINT UNSIGNED
)
INSERT IGNORE INTO amizades (id_usuario, id_amigo, status)
VALUES (p_id_usuario, p_id_amigo, 'pendente');

DROP PROCEDURE IF EXISTS aceitar_amizade;
CREATE PROCEDURE aceitar_amizade(
    IN p_id_usuario BIGINT UNSIGNED,
    IN p_id_amigo BIGINT UNSIGNED
)
UPDATE amizades
SET status = 'aceita'
WHERE (
    (id_usuario = p_id_usuario AND id_amigo = p_id_amigo)
    OR (id_usuario = p_id_amigo AND id_amigo = p_id_usuario)
)
AND status = 'pendente';

DROP PROCEDURE IF EXISTS remover_amigo;
CREATE PROCEDURE remover_amigo(
    IN p_id_usuario BIGINT UNSIGNED,
    IN p_id_amigo BIGINT UNSIGNED
)
DELETE FROM amizades
WHERE (id_usuario = p_id_usuario AND id_amigo = p_id_amigo)
   OR (id_usuario = p_id_amigo AND id_amigo = p_id_usuario);

DROP PROCEDURE IF EXISTS ver_usuario;
CREATE PROCEDURE ver_usuario(
    IN p_id BIGINT UNSIGNED
)
SELECT id, nome, sobrenome, email, data_nascimento, genero, saldo, criado_em
FROM usuarios
WHERE id = p_id;

DROP PROCEDURE IF EXISTS desafios_abertos;
CREATE PROCEDURE desafios_abertos(
    IN p_id_usuario BIGINT UNSIGNED
)
SELECT d.*, u.nome AS nome_criador
FROM desafios d
JOIN usuarios u ON d.id_criador = u.id
WHERE (d.id_criador = p_id_usuario OR d.id_desafiado = p_id_usuario)
AND d.status IN ('aberto', 'em_andamento');

-- =========================
-- SEED
-- =========================
-- ATENÇÃO: Os hashes de senha abaixo são placeholders inválidos e NÃO funcionam com bcrypt.
-- Eles existem apenas para popular o banco com dados de exemplo na fase de desenvolvimento.
-- Para inserir o usuário de teste com hash bcrypt real, execute:
--
--   go run cmd/seed/main.go
--
-- O script acima gera o hash correto de "senha123" e verifica se o usuário já existe
-- antes de inserir, evitando duplicatas.
INSERT IGNORE INTO usuarios (nome, sobrenome, email, senha, data_nascimento, genero, saldo)
VALUES
('João','Silva','joao@example.com','$2a$10$examplehash1','1995-03-15','M',500),
('Maria','Souza','maria@example.com','$2a$10$examplehash2','1998-07-22','F',300),
('Pedro','Lima','pedro@example.com','$2a$10$examplehash3','1992-11-08','M',750);
