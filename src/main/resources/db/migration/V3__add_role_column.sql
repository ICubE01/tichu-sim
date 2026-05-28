alter table users
    add column role enum('USER', 'ADMIN', 'BOT') default 'USER' not null;

