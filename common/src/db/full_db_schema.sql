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
    date DATE PRIMARY KEY NOT NULL,
    across_1 INT NOT NULL,
    across_2 INT NOT NULL,
    across_3 INT NOT NULL,
    down_1 INT NOT NULL,
    down_2 INT NOT NULL,
    down_3 INT NOT NULL,
    FOREIGN KEY (across_1) REFERENCES actors_and_categories(id),
    FOREIGN KEY (across_2) REFERENCES actors_and_categories(id),
    FOREIGN KEY (across_3) REFERENCES actors_and_categories(id),
    FOREIGN KEY (down_1) REFERENCES actors_and_categories(id),
    FOREIGN KEY (down_2) REFERENCES actors_and_categories(id),
    FOREIGN KEY (down_3) REFERENCES actors_and_categories(id)
);

CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY NOT NULL,
    grid_date DATE NOT NULL,
    score INT NOT NULL,
    FOREIGN KEY (grid_date) REFERENCES grids(date)
);

CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY NOT NULL,
    grid_date DATE NOT NULL,
    score_id INT NOT NULL,
    across_index INT NOT NULL,
    down_index INT NOT NULL,
    credit_id INT NOT NULL,
    credit_type VARCHAR(255) NOT NULL,
    correct BOOLEAN NOT NULL,
    FOREIGN KEY (grid_date) REFERENCES grids(date),
    FOREIGN KEY (score_id) REFERENCES scores(id),
    FOREIGN KEY (credit_id, credit_type) REFERENCES credits(id, type)
);
