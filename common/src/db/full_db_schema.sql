-- Switch to the database
\c movie_grid;

CREATE TABLE IF NOT EXISTS actors_and_categories (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS credits (
    id INT PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    popularity FLOAT,
    release_date DATE,
    last_air_date DATE,
    rating VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS genres (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS actors_categories_credits_join (
    actor_category_id INT,
    credit_id INT,
    FOREIGN KEY (actor_category_id) REFERENCES actors_and_categories(id),
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    PRIMARY KEY (actor_category_id, credit_id)
);

CREATE TABLE IF NOT EXISTS credits_genres_join (
    credit_id INT,
    genre_id INT,
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    PRIMARY KEY (credit_id, genre_id)
);

CREATE TABLE IF NOT EXISTS grids (
    id SERIAL PRIMARY KEY,
    date DATE,
    across_1 INT,
    across_2 INT,
    across_3 INT,
    down_1 INT,
    down_2 INT,
    down_3 INT,
    FOREIGN KEY (across_1) REFERENCES actors_and_categories(id),
    FOREIGN KEY (across_2) REFERENCES actors_and_categories(id),
    FOREIGN KEY (across_3) REFERENCES actors_and_categories(id),
    FOREIGN KEY (down_1) REFERENCES actors_and_categories(id),
    FOREIGN KEY (down_2) REFERENCES actors_and_categories(id),
    FOREIGN KEY (down_3) REFERENCES actors_and_categories(id)
);

CREATE TABLE IF NOT EXISTS scores (
    grid_id INT,
    score INT,
    FOREIGN KEY (grid_id) REFERENCES grids(id)
);

CREATE TABLE IF NOT EXISTS answers (
    grid_id INT,
    across_index INT,
    down_index INT,
    credit_id INT,
    correct BOOLEAN,
    FOREIGN KEY (grid_id) REFERENCES grids(id)
);
