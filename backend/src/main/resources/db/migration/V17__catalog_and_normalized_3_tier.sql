-- ===================================================================
-- Flyway Migration: V17__catalog_and_normalized_3_tier.sql
-- Description: 3-Tier Architecture with Normalized Catalogs (Colleges,
--              Companies, Fields of Study), Master Discoverability,
--              and Geospatial Radius Positioning.
-- ===================================================================

-- 1. Create Catalog: colleges
CREATE TABLE IF NOT EXISTS colleges (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    short_name VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_short_name ON colleges(short_name);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON colleges(city);
CREATE INDEX IF NOT EXISTS idx_colleges_verified ON colleges(is_verified);

-- 2. Create Catalog: companies
CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    industry VARCHAR(100),
    domain VARCHAR(100),
    logo_url VARCHAR(500),
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(is_verified);

-- 3. Create Catalog: fields_of_study
CREATE TABLE IF NOT EXISTS fields_of_study (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fields_name ON fields_of_study(name);

-- 4. Enhance discovery_cards to house real card attributes & master discoverability switch
ALTER TABLE discovery_cards
    ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS college_id BIGINT REFERENCES colleges(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS custom_college_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS is_passout BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS passout_year INTEGER,
    ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS custom_company_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS role_title VARCHAR(150),
    ADD COLUMN IF NOT EXISTS field_of_study_id BIGINT REFERENCES fields_of_study(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS custom_field_of_study VARCHAR(150),
    ADD COLUMN IF NOT EXISTS age INTEGER,
    ADD COLUMN IF NOT EXISTS birthdate DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(30) DEFAULT 'PREFER_NOT_TO_SAY',
    ADD COLUMN IF NOT EXISTS intent VARCHAR(50) DEFAULT 'OPEN_TO_ANY',
    ADD COLUMN IF NOT EXISTS city_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS show_distance BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS show_passout_status BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_cards_is_discoverable ON discovery_cards(is_discoverable);
CREATE INDEX IF NOT EXISTS idx_cards_college_id ON discovery_cards(college_id);
CREATE INDEX IF NOT EXISTS idx_cards_company_id ON discovery_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_cards_field_id ON discovery_cards(field_of_study_id);
CREATE INDEX IF NOT EXISTS idx_cards_is_passout ON discovery_cards(is_passout);
CREATE INDEX IF NOT EXISTS idx_cards_age ON discovery_cards(age);
CREATE INDEX IF NOT EXISTS idx_cards_intent ON discovery_cards(intent);
CREATE INDEX IF NOT EXISTS idx_cards_geo ON discovery_cards(latitude, longitude);

-- 5. Pre-seed Colleges & Universities
INSERT INTO colleges (name, short_name, city, state, country, is_verified, usage_count)
VALUES
    ('Ajay Kumar Garg Engineering College (AKGEC)', 'AKGEC', 'Ghaziabad', 'Uttar Pradesh', 'India', TRUE, 50),
    ('KIET Group of Institutions', 'KIET', 'Ghaziabad', 'Uttar Pradesh', 'India', TRUE, 30),
    ('ABES Engineering College', 'ABES', 'Ghaziabad', 'Uttar Pradesh', 'India', TRUE, 25),
    ('Galgotias University', 'GU', 'Greater Noida', 'Uttar Pradesh', 'India', TRUE, 40),
    ('Indian Institute of Technology Delhi', 'IITD', 'New Delhi', 'Delhi', 'India', TRUE, 100),
    ('Indian Institute of Technology Bombay', 'IITB', 'Mumbai', 'Maharashtra', 'India', TRUE, 100),
    ('Indian Institute of Technology Madras', 'IITM', 'Chennai', 'Tamil Nadu', 'India', TRUE, 100),
    ('Indian Institute of Technology Kanpur', 'IITK', 'Kanpur', 'Uttar Pradesh', 'India', TRUE, 90),
    ('Indian Institute of Technology Kharagpur', 'IITKGP', 'Kharagpur', 'West Bengal', 'India', TRUE, 90),
    ('Indian Institute of Technology Roorkee', 'IITR', 'Roorkee', 'Uttarakhand', 'India', TRUE, 85),
    ('BITS Pilani', 'BITS', 'Pilani', 'Rajasthan', 'India', TRUE, 95),
    ('Delhi Technological University', 'DTU', 'New Delhi', 'Delhi', 'India', TRUE, 80),
    ('Netaji Subhas University of Technology', 'NSUT', 'New Delhi', 'Delhi', 'India', TRUE, 75),
    ('Indraprastha Institute of Information Technology Delhi', 'IIITD', 'New Delhi', 'Delhi', 'India', TRUE, 70),
    ('International Institute of Information Technology Hyderabad', 'IIITH', 'Hyderabad', 'Telangana', 'India', TRUE, 80),
    ('University of Delhi', 'DU', 'New Delhi', 'Delhi', 'India', TRUE, 120),
    ('Vellore Institute of Technology', 'VIT', 'Vellore', 'Tamil Nadu', 'India', TRUE, 85),
    ('SRM Institute of Science and Technology', 'SRM', 'Chennai', 'Tamil Nadu', 'India', TRUE, 70),
    ('Manipal Academy of Higher Education', 'MAHE', 'Manipal', 'Karnataka', 'India', TRUE, 65),
    ('Amity University', 'AU', 'Noida', 'Uttar Pradesh', 'India', TRUE, 60),
    ('Christ University', 'CU', 'Bengaluru', 'Karnataka', 'India', TRUE, 55),
    ('Ashoka University', 'Ashoka', 'Sonipat', 'Haryana', 'India', TRUE, 45),
    ('Jawaharlal Nehru University', 'JNU', 'New Delhi', 'Delhi', 'India', TRUE, 60),
    ('Harvard University', 'Harvard', 'Cambridge', 'Massachusetts', 'USA', TRUE, 100),
    ('Stanford University', 'Stanford', 'Stanford', 'California', 'USA', TRUE, 100),
    ('Massachusetts Institute of Technology', 'MIT', 'Cambridge', 'Massachusetts', 'USA', TRUE, 100),
    ('University of Oxford', 'Oxford', 'Oxford', 'Oxfordshire', 'UK', TRUE, 90),
    ('University of Cambridge', 'Cambridge', 'Cambridge', 'Cambridgeshire', 'UK', TRUE, 90)
ON CONFLICT (name) DO NOTHING;

-- 6. Pre-seed Companies & Organizations
INSERT INTO companies (name, industry, domain, is_verified, usage_count)
VALUES
    ('Google', 'Technology', 'google.com', TRUE, 100),
    ('Microsoft', 'Technology', 'microsoft.com', TRUE, 95),
    ('Amazon', 'E-Commerce / Cloud', 'amazon.com', TRUE, 95),
    ('Meta', 'Social Media', 'meta.com', TRUE, 85),
    ('Apple', 'Hardware / Software', 'apple.com', TRUE, 85),
    ('Netflix', 'Entertainment / Streaming', 'netflix.com', TRUE, 70),
    ('Uber', 'Mobility', 'uber.com', TRUE, 65),
    ('Tata Consultancy Services (TCS)', 'IT Services', 'tcs.com', TRUE, 90),
    ('Infosys', 'IT Services', 'infosys.com', TRUE, 85),
    ('Wipro', 'IT Services', 'wipro.com', TRUE, 70),
    ('Accenture', 'Consulting & IT', 'accenture.com', TRUE, 80),
    ('Deloitte', 'Consulting / Audit', 'deloitte.com', TRUE, 75),
    ('Cognizant', 'IT Services', 'cognizant.com', TRUE, 65),
    ('Flipkart', 'E-Commerce', 'flipkart.com', TRUE, 70),
    ('Zomato', 'Food Delivery & Tech', 'zomato.com', TRUE, 60),
    ('Swiggy', 'Food & Delivery Tech', 'swiggy.com', TRUE, 60),
    ('Paytm', 'FinTech', 'paytm.com', TRUE, 55),
    ('Goldman Sachs', 'Investment Banking', 'goldmansachs.com', TRUE, 65),
    ('JPMorgan Chase', 'Financial Services', 'jpmorganchase.com', TRUE, 65),
    ('McKinsey & Company', 'Management Consulting', 'mckinsey.com', TRUE, 50)
ON CONFLICT (name) DO NOTHING;

-- 7. Pre-seed Fields of Study
INSERT INTO fields_of_study (name, category, is_verified, usage_count)
VALUES
    ('Computer Science & Engineering', 'Engineering', TRUE, 100),
    ('Information Technology', 'Engineering', TRUE, 80),
    ('Artificial Intelligence & Machine Learning', 'Computer Science', TRUE, 90),
    ('Data Science & Analytics', 'Computer Science', TRUE, 85),
    ('Electronics & Communication Engineering', 'Engineering', TRUE, 70),
    ('Electrical & Electronics Engineering', 'Engineering', TRUE, 60),
    ('Mechanical Engineering', 'Engineering', TRUE, 65),
    ('Civil Engineering', 'Engineering', TRUE, 50),
    ('Biotechnology', 'Life Sciences', TRUE, 40),
    ('Business Administration (BBA / MBA)', 'Management', TRUE, 95),
    ('Finance & Accounting', 'Business & Commerce', TRUE, 75),
    ('Marketing & Communications', 'Business & Media', TRUE, 70),
    ('Medicine & Surgery (MBBS)', 'Healthcare', TRUE, 60),
    ('Law (LLB / LLM)', 'Legal Studies', TRUE, 55),
    ('Product Design & UI/UX', 'Design', TRUE, 65),
    ('Economics', 'Social Sciences', TRUE, 60),
    ('Psychology', 'Social Sciences', TRUE, 50),
    ('Architecture', 'Design & Engineering', TRUE, 45)
ON CONFLICT (name) DO NOTHING;
