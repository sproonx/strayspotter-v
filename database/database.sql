CREATE DATABASE IF NOT EXISTS strayspotter_database;
USE strayspotter_database;

CREATE TABLE IF NOT EXISTS pictures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    latitude FLOAT,
    longitude FLOAT,
    original_time DATETIME,
    postcode INT,
    district_no INT,
    district_name VARCHAR(20),
    user_comment VARCHAR(500),
    cat_status Int
);

SELECT * FROM pictures;