-- =====================================================================
-- AGRIGUARDIAN LMS - SEED DATA FOR SHREE A G JAIN SCHOOL
-- Multi-School AI + IoT Educational Programs
-- =====================================================================

-- Clear existing data if re-seeding
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.faculty_remarks CASCADE;
TRUNCATE TABLE public.assessment_marks CASCADE;
TRUNCATE TABLE public.assessments CASCADE;
TRUNCATE TABLE public.project_media CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.team_progress CASCADE;
TRUNCATE TABLE public.practical_activities CASCADE;
TRUNCATE TABLE public.chapters CASCADE;
TRUNCATE TABLE public.curriculum CASCADE;
TRUNCATE TABLE public.attendance CASCADE;
TRUNCATE TABLE public.sessions CASCADE;
TRUNCATE TABLE public.faculty_assignments CASCADE;
TRUNCATE TABLE public.team_members CASCADE;
TRUNCATE TABLE public.teams CASCADE;
TRUNCATE TABLE public.enrollments CASCADE;
TRUNCATE TABLE public.students CASCADE;
TRUNCATE TABLE public.sections CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.faculty CASCADE;
TRUNCATE TABLE public.school_staff CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.schools CASCADE;

-- 1. Insert School: Shree A G Jain School
INSERT INTO public.schools (id, name, code, address, city, state, contact_person, phone, email, is_active, max_capacity)
VALUES
('jain0000-0000-0000-0000-000000000001', 'Shree A G Jain School', 'SAGJ-01', 'No. 34, EVK Sampath Road, Vepery', 'Chennai', 'Tamil Nadu', 'Principal Office', '+91 44 2661 1234', 'principal@shreeagjainschool.edu.in', true, 800);

-- 2. Insert Profiles (Admin, Faculty, Staff)
INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@agriguardian.io', 'Vikramaditya Roy (Chief Administrator)', 'admin', '+91 98100 00001'),
('f0000000-0000-0000-0000-000000000001', 'dr.arun@agriguardian.io', 'Dr. Arun Kumar', 'faculty', '+91 98100 00002'),
('f0000000-0000-0000-0000-000000000002', 'priya.sharma@agriguardian.io', 'Er. Priya Sharma', 'faculty', '+91 98100 00003'),
('s0000000-0000-0000-0000-000000000001', 'staff.jainschool@school.edu', 'Rajiv Menon', 'staff', '+91 98100 00004');

-- 3. Insert Faculty records
INSERT INTO public.faculty (id, profile_id, specialization, qualification, phone, is_substitute_eligible)
VALUES
('fa000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Computer Vision & Edge IoT in Agriculture', 'Ph.D. in Embedded Systems', '+91 98100 00002', true),
('fa000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'Precision Agri-Robotics & LoRaWAN Networks', 'M.Tech in Agricultural Robotics', '+91 98100 00003', true);

-- 4. Insert School Staff records
INSERT INTO public.school_staff (id, profile_id, school_id, designation, department, employee_id, can_view_reports)
VALUES
('st000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'jain0000-0000-0000-0000-000000000001', 'Academic Coordinator', 'Science & Innovation Dept', 'SAGJ-AC-101', true);

-- 5. Insert Classes (6, 7, 8, 9)
INSERT INTO public.classes (id, grade_level, name, description, academic_year)
VALUES
('c0000000-0000-0000-0000-000000000006', 6, 'Class 6 - Agri-Innovators', 'Foundations of AI sensory observation and basic soil IoT telemetry', '2026-2027'),
('c0000000-0000-0000-0000-000000000007', 7, 'Class 7 - Smart Agronomists', 'Neural networks for weed identification and automated greenhouse microclimates', '2026-2027'),
('c0000000-0000-0000-0000-000000000008', 8, 'Class 8 - Precision Tech Champions', 'Edge AI inference on microcontrollers, LoRaWAN mesh, and smart hydroponics', '2026-2027'),
('c0000000-0000-0000-0000-000000000009', 9, 'Class 9 - Autonomous Farm Architects', 'Deep learning for crop yield prediction, satellite spectral index, autonomous rovers', '2026-2027');

-- 6. Insert Sections (for Shree A G Jain School)
INSERT INTO public.sections (id, class_id, school_id, name, room_number)
VALUES
('sec00000-0000-0000-0000-000000000061', 'c0000000-0000-0000-0000-000000000006', 'jain0000-0000-0000-0000-000000000001', 'A', 'Agri-Lab 6A'),
('sec00000-0000-0000-0000-000000000062', 'c0000000-0000-0000-0000-000000000006', 'jain0000-0000-0000-0000-000000000001', 'B', 'Agri-Lab 6B'),
('sec00000-0000-0000-0000-000000000071', 'c0000000-0000-0000-0000-000000000007', 'jain0000-0000-0000-0000-000000000001', 'A', 'IoT Bay 7A'),
('sec00000-0000-0000-0000-000000000072', 'c0000000-0000-0000-0000-000000000007', 'jain0000-0000-0000-0000-000000000001', 'B', 'IoT Bay 7B'),
('sec00000-0000-0000-0000-000000000081', 'c0000000-0000-0000-0000-000000000008', 'jain0000-0000-0000-0000-000000000001', 'A', 'Robotics Hub 8A'),
('sec00000-0000-0000-0000-000000000082', 'c0000000-0000-0000-0000-000000000008', 'jain0000-0000-0000-0000-000000000001', 'B', 'Robotics Hub 8B'),
('sec00000-0000-0000-0000-000000000091', 'c0000000-0000-0000-0000-000000000009', 'jain0000-0000-0000-0000-000000000001', 'A', 'AI Innovation Cell 9A'),
('sec00000-0000-0000-0000-000000000092', 'c0000000-0000-0000-0000-000000000009', 'jain0000-0000-0000-0000-000000000001', 'B', 'AI Innovation Cell 9B');

-- 7. Insert Curriculum and 5 Chapters per class
INSERT INTO public.curriculum (id, class_id, academic_year, title, description)
VALUES
('cur00000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '2026-2027', 'Class 6 AI & IoT Agri-Foundations', 'Introductory AI classification & soil telemetry modules'),
('cur00000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', '2026-2027', 'Class 7 Smart Agri-Sensors & Vision', 'Intermediate machine learning & IoT greenhouse actuators'),
('cur00000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', '2026-2027', 'Class 8 Edge AI & Autonomous Actuators', 'Embedded neural nets on ESP32/Raspberry Pi and hydro-controllers'),
('cur00000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', '2026-2027', 'Class 9 Advanced Agri-Robotics & Cloud IoT', 'Autonomous field rovers, multi-sensor telematics and yield models');

-- Chapters for Class 6
INSERT INTO public.chapters (id, curriculum_id, class_id, chapter_number, title, category, learning_outcomes, description)
VALUES
('ch000006-0001-0000-0000-000000000001', 'cur00000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 1, 'Introduction to Artificial Intelligence in Agriculture', 'AI', 'Understand AI concepts, historical agriculture challenges, modern smart farming solutions', 'Overview of AI systems in agriculture'),
('ch000006-0002-0000-0000-000000000002', 'cur00000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 2, 'Computer Vision Basics: Leaf Disease Identification', 'AI', 'Image dataset preparation, labeling healthy vs blighted leaves, inference accuracy', 'Visual recognition of healthy vs infected leaves'),
('ch000006-0003-0000-0000-000000000003', 'cur00000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 3, 'IoT Microcontrollers and Soil Moisture Sensing', 'IoT', 'Analog vs digital sensor readings, capacitive soil moisture calibration, serial monitor data', 'Hardware fundamentals using ESP32 and capacitive probes'),
('ch000006-0004-0000-0000-000000000004', 'cur00000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 4, 'Microclimate Telemetry: DHT22 & Ambient Light Monitoring', 'IoT', 'Temperature, relative humidity, lux measurement, data logging over Wi-Fi', 'Environmental data acquisition in nursery beds'),
('ch000006-0005-0000-0000-000000000005', 'cur00000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 5, 'Smart Drip Irrigation Prototype (AI + IoT Capstone)', 'AI_IoT_Capstone', 'Integrate CV soil moisture prediction with solenoid relay pump triggers', 'Full end-to-end autonomous drip watering bench');

-- Practical Activities for Class 6
INSERT INTO public.practical_activities (id, chapter_id, title, description, required_hardware, max_score)
VALUES
('pa000006-0001-0000-0000-000000000001', 'ch000006-0002-0000-0000-000000000002', 'Leaf Blight Visual Classifier Experiment', 'Train a 2-class Teachable Machine vision model to classify tomato blight with 90%+ confidence', 'Webcam, Plant Specimen leaves, Chromebook/Laptop', 30),
('pa000006-0002-0000-0000-000000000002', 'ch000006-0003-0000-0000-000000000003', 'Calibrating Capacitive Soil Probe in Dry vs Saturated Soils', 'Read analog ADC values on ESP32, plot step-response curves, determine optimal moisture threshold', 'ESP32 NodeMCU, Capacitive Probe v1.2, Soil test cups', 30),
('pa000006-0003-0000-0000-000000000003', 'ch000006-0005-0000-0000-000000000005', 'Automated 5V DC Submersible Pump Relay Interfacing', 'Write C++ firmware logic that turns on water pump when both AI visual check and soil sensor agree', '5V Relay module, 5V Mini Submersible pump, Vinyl tubing', 30);

-- NOTE: All prior dummy student records, fake teams, attendance, and assessment marks have been completely wiped.
-- The database is primed for ingestion of official student rosters for Shree A G Jain School (Sheets 6, 7, 8, 9).

-- Initial Audit Log
INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@agriguardian.io', 'SYSTEM_INITIALIZATION', 'system', 'sys-01', '{"event": "Shree A G Jain School registered with Classes 6, 7, 8, 9 ready for student ingestion"}'::jsonb);
