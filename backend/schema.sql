# Script SQL de création de base de données pour flOpEDT

-- Création de la base de données flOpEDT pour MariaDB
-- Adapté pour le script Node.js fourni

DROP DATABASE IF EXISTS flopedt_db;
CREATE DATABASE flopedt_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flopedt_db;

-- ============================================
-- TABLES PRINCIPALES POUR LE SCRIPT NODE.JS
-- ============================================

-- Table des modules (matières)
CREATE TABLE module (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Module',
    abbrev VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_name (dept, name),
    INDEX idx_dept (dept)
);

-- Table des salles
CREATE TABLE room (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_room (dept, name),
    INDEX idx_dept (dept)
);

-- Table des enseignants/tuteurs
CREATE TABLE tutor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept VARCHAR(10) NOT NULL,
    username VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(254),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dept_username (dept, username),
    INDEX idx_dept (dept)
);

-- Table des cours planifiés (table principale)
CREATE TABLE scheduled_course (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    dept VARCHAR(10) NOT NULL,
    train_prog VARCHAR(10), -- BUT1, BUT2, BUT3
    promo_year INT NOT NULL,
    week INT NOT NULL CHECK (week >= 1 AND week <= 53),
    day VARCHAR(2) NOT NULL, -- 'mo', 'tu', 'we', 'th', 'fr'
    start_time INT NOT NULL, -- minutes depuis minuit
    end_time INT NOT NULL,   -- minutes depuis minuit
    type VARCHAR(50),        -- CM, TD, TP
    module_id INT,
    room_id INT,
    tutor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (module_id) REFERENCES module(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE SET NULL,
    FOREIGN KEY (tutor_id) REFERENCES tutor(id) ON DELETE SET NULL,
    
    INDEX idx_dept_week_year (dept, week, promo_year),
    INDEX idx_schedule_time (day, start_time, end_time),
    INDEX idx_external_id (external_id),
    
    CHECK (end_time > start_time)
);

-- Table de liaison cours-groupes (Many-to-Many)
CREATE TABLE course_groups (
    course_id INT NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (course_id, group_name),
    FOREIGN KEY (course_id) REFERENCES scheduled_course(id) ON DELETE CASCADE,
    
    INDEX idx_group_name (group_name)
);

-- Table de hiérarchie des groupes
CREATE TABLE group_hierarchy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept VARCHAR(10) NOT NULL,
    parent_group VARCHAR(100) NOT NULL,
    child_group VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_hierarchy (dept, parent_group, child_group),
    INDEX idx_dept (dept),
    INDEX idx_parent (parent_group),
    INDEX idx_child (child_group)
);

-- ============================================
-- DONNÉES D'EXEMPLE
-- ============================================

-- Départements
INSERT INTO module (dept, name, abbrev) VALUES
('INFO', 'Algorithmique', 'ALGO'),
('INFO', 'Base de données', 'BDD'),
('INFO', 'Programmation Web', 'WEB'),
('RT', 'Réseaux', 'NET'),
('GIM', 'Maintenance', 'MAINT'),
('CS', 'Communication', 'COM');

-- Salles d'exemple
INSERT INTO room (dept, name, capacity) VALUES
('INFO', 'E001', 30),
('INFO', 'E002', 20),
('INFO', 'LAB-INFO', 24),
('RT', 'RT-AMPHI', 80),
('GIM', 'ATELIER-1', 16),
('CS', 'CS-201', 35);

-- Tuteurs d'exemple
INSERT INTO tutor (dept, username, first_name, last_name, email) VALUES
('INFO', 'jdupont', 'Jean', 'Dupont', 'j.dupont@iut-blagnac.fr'),
('INFO', 'mmartin', 'Marie', 'Martin', 'm.martin@iut-blagnac.fr'),
('RT', 'pdurand', 'Pierre', 'Durand', 'p.durand@iut-blagnac.fr'),
('GIM', 'smoreau', 'Sophie', 'Moreau', 's.moreau@iut-blagnac.fr'),
('CS', 'lbernard', 'Lucie', 'Bernard', 'l.bernard@iut-blagnac.fr');

COMMIT;


