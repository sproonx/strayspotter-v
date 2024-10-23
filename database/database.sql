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

INSERT INTO pictures (latitude, longitude, original_time, postcode, district_no, district_name, user_comment, cat_status)
VALUES (37.7749, -122.4194, '2024-10-18 04:56:17' ,94103, 13, 'Geylang, Eunos', 'Found a stray cat near the park', 1);

SELECT * FROM pictures;