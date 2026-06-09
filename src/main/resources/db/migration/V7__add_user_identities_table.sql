create table user_identities
(
    id               bigint auto_increment
        primary key,
    user_id          bigint                              not null,
    provider         varchar(20)                         not null,
    provider_subject varchar(255)                        not null,
    provider_email   varchar(255)                        null,
    created_at       timestamp default current_timestamp not null,
    constraint user_identities_uk
        unique (provider, provider_subject),
    constraint user_identities_users_id_fk
        foreign key (user_id) references users (id)
            on delete cascade
);

