create database pdv;

create table usuarios (
    id serial primary key,
    nome varchar(100) not null,
    email varchar(100) unique not null,
    senha varchar(100) not null
);

create table categorias (
    id serial primary key,
    descricao varchar(100) not null
);

insert into categorias (descricao) values
('Informática'), 
('Celulares'), 
('Beleza e Perfumaria'), 
('Mercado'), 
('Livros e Papelaria'), 
('Brinquedos'), 
('Moda'), 
('Bebê'), 
('Games');

create table clientes (
    id serial primary key,
    nome varchar(100) not null,
    email varchar(100) unique not null,
    telefone varchar(15),
    endereco varchar(200)   
)

CREATE TABLE produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  preco INTEGER NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id)
);

CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
