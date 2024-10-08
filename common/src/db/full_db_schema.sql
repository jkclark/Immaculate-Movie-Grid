-- Switch to the database
\c movie_grid;

CREATE TABLE IF NOT EXISTS actors_and_categories (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS credits (
    id INT NOT NULL,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    popularity FLOAT,
    release_date DATE,
    last_air_date DATE,
    rating VARCHAR(255),
    PRIMARY KEY (id, type)
);

CREATE TABLE IF NOT EXISTS genres (
    id INT PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS actors_categories_credits_join (
    actor_category_id INT NOT NULL,
    credit_id INT NOT NULL,
    credit_type VARCHAR(255) NOT NULL,
    FOREIGN KEY (actor_category_id) REFERENCES actors_and_categories(id),
    FOREIGN KEY (credit_id, credit_type) REFERENCES credits(id, type),
    PRIMARY KEY (actor_category_id, credit_id, credit_type)
);

CREATE TABLE IF NOT EXISTS credits_genres_join (
    credit_id INT NOT NULL,
    credit_type VARCHAR(255) NOT NULL,
    genre_id INT NOT NULL,
    FOREIGN KEY (credit_id, credit_type) REFERENCES credits(id, type),
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    PRIMARY KEY (credit_id, credit_type, genre_id)
);

CREATE TABLE IF NOT EXISTS grids (
    id SERIAL PRIMARY KEY NOT NULL,
    date DATE NOT NULL,
    across_1 INT NOT NULL,
    across_1_type VARCHAR(255) NOT NULL,
    across_2 INT NOT NULL,
    across_2_type VARCHAR(255) NOT NULL,
    across_3 INT NOT NULL,
    across_3_type VARCHAR(255) NOT NULL,
    down_1 INT NOT NULL,
    down_1_type VARCHAR(255) NOT NULL,
    down_2 INT NOT NULL,
    down_2_type VARCHAR(255) NOT NULL,
    down_3 INT NOT NULL,
    down_3_type VARCHAR(255) NOT NULL,
    FOREIGN KEY (across_1, across_1_type) REFERENCES credits(id, type),
    FOREIGN KEY (across_2, across_2_type) REFERENCES credits(id, type),
    FOREIGN KEY (across_3, across_3_type) REFERENCES credits(id, type),
    FOREIGN KEY (down_1, down_1_type) REFERENCES credits(id, type),
    FOREIGN KEY (down_2, down_2_type) REFERENCES credits(id, type),
    FOREIGN KEY (down_3, down_3_type) REFERENCES credits(id, type)
);

CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY NOT NULL,
    grid_id INT NOT NULL,
    score INT NOT NULL,
    FOREIGN KEY (grid_id) REFERENCES grids(id)
);

CREATE TABLE IF NOT EXISTS answers (
    grid_id INT NOT NULL,
    across_index INT NOT NULL,
    down_index INT NOT NULL,
    credit_id INT NOT NULL,
    correct BOOLEAN NOT NULL,
    FOREIGN KEY (grid_id) REFERENCES grids(id)
);
