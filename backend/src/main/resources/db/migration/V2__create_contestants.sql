CREATE TABLE contestants (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    hometown   VARCHAR(100),
    state      VARCHAR(100),
    image_url  VARCHAR(500),
    PRIMARY KEY (id)
);
