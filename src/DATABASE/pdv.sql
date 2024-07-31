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