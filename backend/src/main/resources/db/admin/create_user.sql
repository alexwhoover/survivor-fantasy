CREATE USER 'survivor_app'@'%' IDENTIFIED BY 'survivor_app';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, REFERENCES
    ON survivor_league.* TO 'survivor_app'@'%';

FLUSH PRIVILEGES;