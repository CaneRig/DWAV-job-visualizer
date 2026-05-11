const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Seeded PRNG for reproducibility ────────────────────────────────────────
let _seed = 42;
function seedRandom(s) { _seed = s; }
function random() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function randInt(min, max) { return Math.floor(random() * (max - min + 1)) + min; }
function randFloat(min, max) { return random() * (max - min) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n) {
  return shuffle(arr).slice(0, n);
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TOTAL_JOBS = 5000;

const DS_SUBCATEGORIES = [
  'Data Scientist', 'ML Engineer', 'Data Analyst', 'Data Engineer',
  'NLP Engineer', 'Computer Vision Engineer', 'AI Researcher',
  'Deep Learning Engineer', 'BI Analyst', 'Business Analyst'
];
const IT_SUBCATEGORIES = [
  'Backend Developer', 'Frontend Developer', 'Full-stack Developer',
  'DevOps Engineer', 'QA Engineer', 'System Administrator', 'DBA',
  'Project Manager', 'Product Manager', 'Mobile Developer',
  'Security Engineer', 'Cloud Engineer', 'Tech Lead', 'Architect'
];

const DS_SUBCATEGORY_WEIGHTS = [22, 18, 18, 12, 6, 5, 5, 5, 5, 4];
const IT_SUBCATEGORY_WEIGHTS = [20, 15, 14, 10, 8, 4, 3, 6, 5, 5, 3, 3, 2, 2];

// Seniority prefixes for titles
const SENIORITY_EN = ['Junior', 'Middle', 'Senior', 'Lead', 'Principal'];
const SENIORITY_RU = ['Младший', '', 'Ведущий', 'Главный', ''];
const SENIORITY_WEIGHTS = [12, 35, 32, 14, 7];

// Title templates per subcategory
const TITLE_TEMPLATES = {
  'Data Scientist': {
    en: ['Data Scientist', 'Data Science Specialist', 'Data Scientist / Analyst'],
    ru: ['Аналитик данных', 'Специалист по Data Science', 'Ученый по данным']
  },
  'ML Engineer': {
    en: ['ML Engineer', 'Machine Learning Engineer', 'ML Developer'],
    ru: ['ML инженер', 'Инженер машинного обучения', 'Разработчик ML']
  },
  'Data Analyst': {
    en: ['Data Analyst', 'Data Analyst / BI', 'Product Analyst'],
    ru: ['Аналитик данных', 'Продуктовый аналитик', 'BI аналитик']
  },
  'Data Engineer': {
    en: ['Data Engineer', 'Big Data Engineer', 'ETL Developer'],
    ru: ['Инженер данных', 'Big Data инженер', 'Инженер ETL']
  },
  'NLP Engineer': {
    en: ['NLP Engineer', 'NLP Researcher', 'Natural Language Processing Engineer'],
    ru: ['NLP инженер', 'Инженер по обработке естественного языка']
  },
  'Computer Vision Engineer': {
    en: ['Computer Vision Engineer', 'CV Engineer', 'Vision ML Engineer'],
    ru: ['Инженер компьютерного зрения', 'CV инженер']
  },
  'AI Researcher': {
    en: ['AI Researcher', 'Research Scientist', 'AI/ML Researcher'],
    ru: ['Исследователь ИИ', 'Научный сотрудник в области ИИ']
  },
  'Deep Learning Engineer': {
    en: ['Deep Learning Engineer', 'DL Engineer', 'Neural Network Engineer'],
    ru: ['Инженер глубокого обучения', 'DL инженер']
  },
  'BI Analyst': {
    en: ['BI Analyst', 'Business Intelligence Analyst', 'BI Developer'],
    ru: ['BI аналитик', 'Аналитик бизнес-интеллекта']
  },
  'Business Analyst': {
    en: ['Business Analyst', 'System Analyst', 'Business Analyst / Product'],
    ru: ['Бизнес-аналитик', 'Системный аналитик', 'БА']
  },
  'Backend Developer': {
    en: ['Backend Developer', 'Backend Engineer', 'Server Developer', 'Python Developer', 'Java Developer', 'Go Developer'],
    ru: ['Бэкенд-разработчик', 'Разработчик серверных приложений', 'Python разработчик']
  },
  'Frontend Developer': {
    en: ['Frontend Developer', 'Frontend Engineer', 'React Developer', 'UI Developer', 'Web Developer'],
    ru: ['Фронтенд-разработчик', 'React разработчик', 'Веб-разработчик']
  },
  'Full-stack Developer': {
    en: ['Full-stack Developer', 'Full-stack Engineer', 'Full Stack Web Developer'],
    ru: ['Фулстек-разработчик', 'Full-stack разработчик']
  },
  'DevOps Engineer': {
    en: ['DevOps Engineer', 'DevOps Specialist', 'SRE Engineer', 'Platform Engineer'],
    ru: ['DevOps инженер', 'Инженер DevOps']
  },
  'QA Engineer': {
    en: ['QA Engineer', 'QA Automation Engineer', 'Test Engineer', 'SDET', 'QA Lead'],
    ru: ['Инженер по тестированию', 'QA инженер', 'Тестировщик']
  },
  'System Administrator': {
    en: ['System Administrator', 'Linux Administrator', 'Systems Engineer'],
    ru: ['Системный администратор', 'Linux администратор']
  },
  'DBA': {
    en: ['Database Administrator', 'DBA Engineer', 'DB Administrator'],
    ru: ['Администратор баз данных', 'DBA']
  },
  'Project Manager': {
    en: ['Project Manager', 'IT Project Manager', 'Project Coordinator'],
    ru: ['Руководитель проекта', 'Проектный менеджер', 'IT проектный менеджер']
  },
  'Product Manager': {
    en: ['Product Manager', 'Senior Product Manager', 'Product Owner'],
    ru: ['Продакт-менеджер', 'Менеджер продукта', 'Product Owner']
  },
  'Mobile Developer': {
    en: ['Mobile Developer', 'iOS Developer', 'Android Developer', 'Flutter Developer', 'React Native Developer'],
    ru: ['Мобильный разработчик', 'iOS разработчик', 'Android разработчик']
  },
  'Security Engineer': {
    en: ['Security Engineer', 'Information Security Engineer', 'Cybersecurity Specialist', 'AppSec Engineer'],
    ru: ['Инженер информационной безопасности', 'Специалист по ИБ']
  },
  'Cloud Engineer': {
    en: ['Cloud Engineer', 'Cloud Architect', 'Cloud Infrastructure Engineer'],
    ru: ['Облачный инженер', 'Инженер облачной инфраструктуры']
  },
  'Tech Lead': {
    en: ['Tech Lead', 'Technical Lead', 'Development Team Lead'],
    ru: ['Техлид', 'Технический руководитель', 'Ведущий разработчик']
  },
  'Architect': {
    en: ['Software Architect', 'Solution Architect', 'System Architect', 'Enterprise Architect'],
    ru: ['Архитектор систем', 'Системный архитектор', 'Solution Architect']
  }
};

// Companies with weights (larger companies post more)
const COMPANIES = [
  { name: 'Yandex', weight: 40 },
  { name: 'Sberbank', weight: 38 },
  { name: 'Tinkoff', weight: 32 },
  { name: 'VK', weight: 30 },
  { name: 'Mail.ru Group', weight: 28 },
  { name: 'Ozon', weight: 25 },
  { name: 'Kaspersky', weight: 22 },
  { name: '1C', weight: 20 },
  { name: 'MTS', weight: 18 },
  { name: 'Alfa-Bank', weight: 18 },
  { name: 'Rostelecom', weight: 16 },
  { name: 'Beeline', weight: 15 },
  { name: 'Gazprom-neft', weight: 14 },
  { name: 'HeadHunter', weight: 14 },
  { name: 'Avito', weight: 14 },
  { name: 'Wildberries', weight: 13 },
  { name: 'JetBrains', weight: 12 },
  { name: 'Huawei Russia', weight: 12 },
  { name: 'Accenture', weight: 11 },
  { name: 'EPAM', weight: 11 },
  { name: 'Luxoft', weight: 10 },
  { name: 'Positive Technologies', weight: 10 },
  { name: '2GIS', weight: 9 },
  { name: 'Lamoda', weight: 9 },
  { name: 'YADRO', weight: 8 },
  { name: 'Biocad', weight: 7 },
  { name: 'Bercut', weight: 7 },
  { name: 'Norilsk Nickel', weight: 7 },
  { name: 'Tarbagatai', weight: 6 },
  { name: 'Databases', weight: 6 },
  // Small/medium companies
  { name: 'КРОК', weight: 8 },
  { name: 'Softline', weight: 7 },
  { name: 'LANIT', weight: 7 },
  { name: 'ITera', weight: 5 },
  { name: 'DataSpace', weight: 5 },
  { name: 'Информационные технологии', weight: 5 },
  { name: 'Сигма', weight: 4 },
  { name: 'Техносерв', weight: 4 },
  { name: 'IBS', weight: 5 },
  { name: 'BSS', weight: 4 },
  { name: 'SimbirSoft', weight: 4 },
  { name: 'Aston', weight: 4 },
  { name: 'Daata', weight: 3 },
  { name: 'Стромсервис', weight: 3 },
  { name: 'IT-Альянс', weight: 3 },
  { name: 'Novacom', weight: 3 },
  { name: 'РТК-ИТ', weight: 3 },
  { name: 'ЦФТ', weight: 4 },
  { name: 'СКБ Контур', weight: 5 },
  { name: 'Тензор', weight: 4 },
  { name: 'WebCanape', weight: 3 },
  { name: 'ByteForge', weight: 2 },
  { name: 'CloudBridge', weight: 2 },
  { name: 'DataPulse', weight: 2 },
  { name: 'SmartLogic', weight: 2 },
  { name: 'NeoTech Solutions', weight: 2 },
  { name: 'QuantumBit', weight: 2 },
  { name: 'CodeCraft', weight: 2 },
  { name: 'DigiCore', weight: 2 },
  { name: 'AlgoSoft', weight: 2 },
  { name: 'NextGen IT', weight: 2 },
  { name: 'PixelPerfect', weight: 2 },
  { name: 'InfraBuild', weight: 2 },
  { name: 'NetSphere', weight: 2 },
  { name: 'TechVault', weight: 2 },
  { name: 'DataMind', weight: 2 },
  { name: 'CloudPeak', weight: 2 },
  { name: 'CyberCore', weight: 2 },
  { name: 'DevStream', weight: 2 },
  { name: 'SoftEdge', weight: 2 },
  { name: 'AppWorks', weight: 2 },
  { name: 'LogicBase', weight: 2 },
  { name: 'SyncIT', weight: 2 },
  { name: 'ProTech', weight: 2 },
  { name: 'AI Solutions', weight: 2 },
  { name: 'ML Factory', weight: 2 },
  { name: 'DeepVision', weight: 2 },
  { name: 'BrainScale', weight: 2 },
  { name: 'PredictaLab', weight: 2 },
  { name: 'InsightData', weight: 2 },
  { name: 'Numera', weight: 2 },
];

const COMPANY_NAMES = COMPANIES.map(c => c.name);
const COMPANY_WEIGHTS = COMPANIES.map(c => c.weight);

// Regions with weights
const REGIONS = [
  { region: 'Москва', location: 'Москва', weight: 45 },
  { region: 'Санкт-Петербург', location: 'Санкт-Петербург', weight: 20 },
  { region: 'Новосибирск', location: 'Новосибирск', weight: 5 },
  { region: 'Екатеринбург', location: 'Екатеринбург', weight: 4 },
  { region: 'Казань', location: 'Казань', weight: 3 },
  { region: 'Нижний Новгород', location: 'Нижний Новгород', weight: 3 },
  { region: 'Ростов-на-Дону', location: 'Ростов-на-Дону', weight: 2 },
  // Other cities
  { region: 'Самара', location: 'Самара', weight: 1.5 },
  { region: 'Челябинск', location: 'Челябинск', weight: 1 },
  { region: 'Омск', location: 'Омск', weight: 0.8 },
  { region: 'Краснодар', location: 'Краснодар', weight: 1.5 },
  { region: 'Воронеж', location: 'Воронеж', weight: 1 },
  { region: 'Уфа', location: 'Уфа', weight: 1 },
  { region: 'Красноярск', location: 'Красноярск', weight: 0.8 },
  { region: 'Пермь', location: 'Пермь', weight: 0.8 },
  { region: 'Волгоград', location: 'Волгоград', weight: 0.7 },
  { region: 'Ижевск', location: 'Ижевск', weight: 0.5 },
  { region: 'Тюмень', location: 'Тюмень', weight: 0.7 },
  { region: 'Томск', location: 'Томск', weight: 0.5 },
  { region: 'Тольятти', location: 'Тольятти', weight: 0.3 },
  { region: 'Саратов', location: 'Саратов', weight: 0.4 },
  { region: 'Калининград', location: 'Калининград', weight: 0.5 },
  { region: 'Владивосток', location: 'Владивосток', weight: 0.4 },
  { region: 'Набережные Челны', location: 'Набережные Челны', weight: 0.3 },
];

const REGION_NAMES = REGIONS.map(r => r.region);
const REGION_LOCATIONS = REGIONS.map(r => r.location);
const REGION_WEIGHTS = REGIONS.map(r => r.weight);

// Skills
const DS_SKILLS = [
  { skill: 'Python', weight: 95 },
  { skill: 'SQL', weight: 80 },
  { skill: 'Machine Learning', weight: 70 },
  { skill: 'Pandas', weight: 65 },
  { skill: 'NumPy', weight: 60 },
  { skill: 'Scikit-learn', weight: 55 },
  { skill: 'Git', weight: 55 },
  { skill: 'Jupyter', weight: 45 },
  { skill: 'TensorFlow', weight: 40 },
  { skill: 'PyTorch', weight: 38 },
  { skill: 'Docker', weight: 35 },
  { skill: 'Deep Learning', weight: 32 },
  { skill: 'Statistical Analysis', weight: 30 },
  { skill: 'A/B Testing', weight: 28 },
  { skill: 'Data Mining', weight: 25 },
  { skill: 'NLP', weight: 22 },
  { skill: 'Computer Vision', weight: 20 },
  { skill: 'R', weight: 18 },
  { skill: 'Tableau', weight: 22 },
  { skill: 'Power BI', weight: 20 },
  { skill: 'Airflow', weight: 18 },
  { skill: 'Spark', weight: 16 },
  { skill: 'Hadoop', weight: 12 },
  { skill: 'Keras', weight: 15 },
  { skill: 'BigQuery', weight: 12 },
  { skill: 'MLflow', weight: 10 },
  { skill: 'DVC', weight: 7 },
  { skill: 'Kubeflow', weight: 6 },
  { skill: 'Cassandra', weight: 5 },
  { skill: 'Elasticsearch', weight: 8 },
];

const IT_SKILLS = [
  { skill: 'Python', weight: 85 },
  { skill: 'Git', weight: 80 },
  { skill: 'SQL', weight: 60 },
  { skill: 'JavaScript', weight: 50 },
  { skill: 'Docker', weight: 50 },
  { skill: 'Linux', weight: 50 },
  { skill: 'PostgreSQL', weight: 42 },
  { skill: 'REST API', weight: 40 },
  { skill: 'TypeScript', weight: 38 },
  { skill: 'CI/CD', weight: 38 },
  { skill: 'Java', weight: 35 },
  { skill: 'React', weight: 30 },
  { skill: 'Node.js', weight: 30 },
  { skill: 'Kubernetes', weight: 28 },
  { skill: 'Microservices', weight: 25 },
  { skill: 'Redis', weight: 25 },
  { skill: 'MySQL', weight: 22 },
  { skill: 'Go', weight: 22 },
  { skill: 'Nginx', weight: 22 },
  { skill: 'Spring', weight: 20 },
  { skill: 'Django', weight: 18 },
  { skill: 'MongoDB', weight: 18 },
  { skill: 'AWS', weight: 18 },
  { skill: 'Kotlin', weight: 15 },
  { skill: 'Angular', weight: 14 },
  { skill: 'Vue.js', weight: 14 },
  { skill: 'Flask', weight: 14 },
  { skill: 'FastAPI', weight: 16 },
  { skill: 'C++', weight: 14 },
  { skill: 'C#', weight: 14 },
  { skill: 'PHP', weight: 12 },
  { skill: 'RabbitMQ', weight: 12 },
  { skill: 'Kafka', weight: 12 },
  { skill: 'Terraform', weight: 12 },
  { skill: 'Jenkins', weight: 11 },
  { skill: 'Ansible', weight: 10 },
  { skill: 'Selenium', weight: 10 },
  { skill: 'Jest', weight: 9 },
  { skill: 'Webpack', weight: 9 },
  { skill: 'GraphQL', weight: 8 },
  { skill: 'GCP', weight: 8 },
  { skill: 'Azure', weight: 7 },
];

// Skills per subcategory mapping for more realistic correlations
const SUBCATEGORY_SKILL_BOOST = {
  'Data Scientist': { 'Machine Learning': 30, 'Scikit-learn': 20, 'Statistical Analysis': 25, 'A/B Testing': 20, 'Pandas': 20, 'NumPy': 15 },
  'ML Engineer': { 'TensorFlow': 25, 'PyTorch': 25, 'Machine Learning': 25, 'MLflow': 15, 'Kubeflow': 10, 'Docker': 15, 'Kubernetes': 10 },
  'Data Analyst': { 'SQL': 15, 'Tableau': 20, 'Power BI': 20, 'A/B Testing': 20, 'Statistical Analysis': 15, 'Pandas': 15 },
  'Data Engineer': { 'Spark': 25, 'Airflow': 25, 'Hadoop': 15, 'BigQuery': 20, 'Docker': 15, 'Kubernetes': 10, 'Elasticsearch': 10 },
  'NLP Engineer': { 'NLP': 40, 'PyTorch': 20, 'TensorFlow': 15, 'Deep Learning': 20, 'Keras': 15 },
  'Computer Vision Engineer': { 'Computer Vision': 40, 'PyTorch': 20, 'TensorFlow': 15, 'Deep Learning': 20, 'OpenCV': 15 },
  'AI Researcher': { 'Deep Learning': 25, 'PyTorch': 25, 'TensorFlow': 20, 'Statistical Analysis': 15, 'R': 10 },
  'Deep Learning Engineer': { 'PyTorch': 30, 'TensorFlow': 25, 'Deep Learning': 35, 'Keras': 20, 'Docker': 10 },
  'BI Analyst': { 'SQL': 20, 'Tableau': 30, 'Power BI': 30, 'A/B Testing': 15, 'Statistical Analysis': 10 },
  'Business Analyst': { 'SQL': 15, 'Tableau': 15, 'Power BI': 15, 'A/B Testing': 10, 'Jira': 10 },
  'Backend Developer': { 'Java': 20, 'Python': 15, 'Go': 15, 'Spring': 20, 'Django': 10, 'FastAPI': 10, 'PostgreSQL': 15, 'Redis': 10, 'Microservices': 15 },
  'Frontend Developer': { 'JavaScript': 30, 'TypeScript': 25, 'React': 30, 'Angular': 15, 'Vue.js': 15, 'Webpack': 10, 'Jest': 10, 'Node.js': 10 },
  'Full-stack Developer': { 'JavaScript': 20, 'TypeScript': 15, 'React': 20, 'Node.js': 20, 'PostgreSQL': 15, 'Docker': 10 },
  'DevOps Engineer': { 'Docker': 25, 'Kubernetes': 25, 'CI/CD': 25, 'Terraform': 20, 'Ansible': 15, 'AWS': 20, 'Linux': 20, 'Jenkins': 15 },
  'QA Engineer': { 'Selenium': 25, 'Jest': 15, 'Python': 15, 'CI/CD': 15, 'Docker': 10 },
  'System Administrator': { 'Linux': 30, 'Docker': 15, 'Ansible': 20, 'Nginx': 20, 'Terraform': 10 },
  'DBA': { 'PostgreSQL': 25, 'MySQL': 20, 'Redis': 15, 'SQL': 25, 'Linux': 15, 'MongoDB': 10 },
  'Project Manager': { 'Jira': 20, 'Agile': 20, 'CI/CD': 5, 'Docker': 5 },
  'Product Manager': { 'SQL': 15, 'A/B Testing': 20, 'Tableau': 10 },
  'Mobile Developer': { 'Kotlin': 25, 'Swift': 15, 'JavaScript': 10, 'React': 10, 'TypeScript': 10, 'Docker': 10 },
  'Security Engineer': { 'Linux': 20, 'Docker': 10, 'Kubernetes': 10, 'Python': 15, 'Ansible': 10 },
  'Cloud Engineer': { 'AWS': 30, 'GCP': 20, 'Azure': 20, 'Terraform': 25, 'Kubernetes': 20, 'Docker': 20 },
  'Tech Lead': { 'Docker': 15, 'Kubernetes': 15, 'Microservices': 15, 'CI/CD': 15, 'PostgreSQL': 10 },
  'Architect': { 'Microservices': 25, 'Kubernetes': 20, 'Docker': 15, 'AWS': 15, 'PostgreSQL': 10, 'Kafka': 15, 'RabbitMQ': 10 },
};

// Description snippets
const DESCRIPTION_TEMPLATES = {
  DS: [
    'Ищем специалиста для работы с большими данными и построения ML-моделей.',
    'Требуется аналитик для разработки алгоритмов машинного обучения.',
    'Присоединяйтесь к нашей data-команде для создания интеллектуальных систем.',
    'Ищем инженера для разработки и внедрения ML-решений в продакшен.',
    'Нужен специалист для анализа данных и построения предиктивных моделей.',
    'Ищем кандидата для работы над проектами в области искусственного интеллекта.',
    'Требуется разработчик ML-моделей для решения бизнес-задач компании.',
    'Отличная возможность для специалиста по данным в динамично развивающейся команде.',
    'Ищем инженера по данным для проектирования пайплайнов обработки данных.',
    'Требуется аналитик для проведения A/B тестов и анализа продуктовых метрик.',
    'Разработка и оптимизация ML-моделей для рекомендательных систем.',
    'Создание и поддержка инфраструктуры для обучения и деплоя ML-моделей.',
    'Анализ больших данных и построение дашбордов для бизнес-заказчиков.',
    'Разработка NLP-решений для автоматизации обработки текстов.',
    'Исследования в области компьютерного зрения и глубокого обучения.',
  ],
  IT: [
    'Ищем разработчика для работы над высоконагруженными системами.',
    'Требуется специалист для развития микросервисной архитектуры проекта.',
    'Присоединяйтесь к нашей команде для создания современных веб-приложений.',
    'Ищем инженера для автоматизации процессов CI/CD и инфраструктуры.',
    'Нужен разработчик для создания и поддержки серверной части платформы.',
    'Требуется QA-инженер для обеспечения качества наших продуктов.',
    'Ищем девопса для управления облачной инфраструктурой и деплоя.',
    'Отличная возможность для разработчика в международной IT-компании.',
    'Ищем мобильного разработчика для создания приложений на iOS/Android.',
    'Требуется архитектор для проектирования масштабируемых решений.',
    'Разработка и поддержка backend-сервисов с миллионами пользователей.',
    'Управление IT-проектами и координация распределённых команд.',
    'Создание безопасных и надёжных решений для финансового сектора.',
    'Проектирование и оптимизация облачной инфраструктуры.',
    'Разработка фронтенд-приложений с акцентом на UX и производительность.',
  ]
};

// ─── Salary Generation ──────────────────────────────────────────────────────

const SALARY_RANGES = {
  'No experience': { from: [40000, 55000], to: [60000, 90000] },
  '1-3 years': { from: [80000, 110000], to: [130000, 180000] },
  '3-6 years': { from: [150000, 200000], to: [250000, 350000] },
  '6+ years': { from: [250000, 350000], to: [400000, 600000] },
};

function generateSalary(experience, category, region, isRemote) {
  // ~30% null salary
  if (random() < 0.30) return { salary_from: null, salary_to: null, salary_currency: 'RUB', salary_gross: true };

  const range = SALARY_RANGES[experience];
  let from = randInt(range.from[0], range.from[1]);
  let to = randInt(range.to[0], range.to[1]);

  // Ensure to >= from
  if (to < from) to = from + randInt(20000, 50000);

  // Data Science premium: 10-20%
  if (category === 'Data Science') {
    const premium = 1 + randFloat(0.10, 0.20);
    from = Math.round(from * premium);
    to = Math.round(to * premium);
  }

  // Moscow premium: 20-30%
  if (region === 'Москва') {
    const premium = 1 + randFloat(0.20, 0.30);
    from = Math.round(from * premium);
    to = Math.round(to * premium);
  }

  // St. Petersburg premium: 10-15%
  if (region === 'Санкт-Петербург') {
    const premium = 1 + randFloat(0.10, 0.15);
    from = Math.round(from * premium);
    to = Math.round(to * premium);
  }

  // Remote discount: 5-10%
  if (isRemote) {
    const discount = 1 - randFloat(0.05, 0.10);
    from = Math.round(from * discount);
    to = Math.round(to * discount);
  }

  // Round to nearest 1000
  from = Math.round(from / 1000) * 1000;
  to = Math.round(to / 1000) * 1000;

  // Some postings in USD/EUR (small %)
  let currency = 'RUB';
  const currencyRoll = random();
  if (currencyRoll < 0.03) {
    currency = 'USD';
    from = Math.round(from / 90 / 100) * 100;
    to = Math.round(to / 90 / 100) * 100;
  } else if (currencyRoll < 0.05) {
    currency = 'EUR';
    from = Math.round(from / 95 / 100) * 100;
    to = Math.round(to / 95 / 100) * 100;
  }

  return {
    salary_from: from,
    salary_to: to,
    salary_currency: currency,
    salary_gross: random() < 0.7 // 70% gross
  };
}

// ─── Skills Generation ──────────────────────────────────────────────────────

function generateSkills(category, subcategory) {
  const baseSkills = category === 'Data Science' ? DS_SKILLS : IT_SKILLS;
  const boost = SUBCATEGORY_SKILL_BOOST[subcategory] || {};

  // Build weighted pool with boosts
  const pool = baseSkills.map(s => ({
    skill: s.skill,
    weight: s.weight + (boost[s.skill] || 0)
  }));

  const numSkills = randInt(3, 8);

  // Select skills using weighted random without replacement
  const selected = [];
  const available = [...pool];

  for (let i = 0; i < numSkills && available.length > 0; i++) {
    const totalWeight = available.reduce((a, b) => a + b.weight, 0);
    let r = random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < available.length; j++) {
      r -= available[j].weight;
      if (r <= 0) { idx = j; break; }
    }
    selected.push(available[idx].skill);
    available.splice(idx, 1);
  }

  return selected;
}

// ─── Title Generation ───────────────────────────────────────────────────────

function generateTitle(subcategory, seniorityIdx) {
  const templates = TITLE_TEMPLATES[subcategory];
  if (!templates) return subcategory;

  // 60% English titles, 40% Russian
  const useRu = random() < 0.40;

  const base = useRu ? pick(templates.ru) : pick(templates.en);
  const prefix = useRu ? SENIORITY_RU[seniorityIdx] : SENIORITY_EN[seniorityIdx];

  if (!prefix) return base;
  return `${prefix} ${base}`;
}

// ─── Experience Distribution ────────────────────────────────────────────────

const EXPERIENCE_LEVELS = ['No experience', '1-3 years', '3-6 years', '6+ years'];
const EXPERIENCE_WEIGHTS = [8, 30, 38, 24];

// ─── Employment Type Distribution ───────────────────────────────────────────

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const EMPLOYMENT_WEIGHTS = [85, 5, 7, 3];

// ─── Remote Distribution ────────────────────────────────────────────────────

// Remote: 40%, On-site: 35%, Hybrid: 25%
const REMOTE_TYPES = ['Remote', 'On-site', 'Hybrid'];
const REMOTE_WEIGHTS = [40, 35, 25];

// ─── Date Generation ────────────────────────────────────────────────────────

function generateDate(now) {
  // Last 30 days with recent bias
  const daysAgo = Math.floor(Math.pow(random(), 0.7) * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  // Random hour/minute
  date.setHours(randInt(8, 20), randInt(0, 59), randInt(0, 59));
  return date.toISOString();
}

// ─── Main Generation ────────────────────────────────────────────────────────

function generateJobs() {
  seedRandom(42);
  const now = new Date();
  const jobs = [];

  // Category split: ~35% DS, ~65% IT
  for (let i = 0; i < TOTAL_JOBS; i++) {
    const category = random() < 0.35 ? 'Data Science' : 'IT';
    const subcategories = category === 'Data Science' ? DS_SUBCATEGORIES : IT_SUBCATEGORIES;
    const subWeights = category === 'Data Science' ? DS_SUBCATEGORY_WEIGHTS : IT_SUBCATEGORY_WEIGHTS;
    const subcategory = pickWeighted(subcategories, subWeights);

    const experience = pickWeighted(EXPERIENCE_LEVELS, EXPERIENCE_WEIGHTS);
    const employmentType = pickWeighted(EMPLOYMENT_TYPES, EMPLOYMENT_WEIGHTS);
    const remoteType = pickWeighted(REMOTE_TYPES, REMOTE_WEIGHTS);
    const isRemote = remoteType !== 'On-site';

    const regionIdx = pickWeighted(REGION_NAMES.map((_, i) => i), REGION_WEIGHTS);
    const region = REGION_NAMES[regionIdx];
    const location = REGION_LOCATIONS[regionIdx];

    const salary = generateSalary(experience, category, region, isRemote);
    const skills = generateSkills(category, subcategory);

    // Seniority based on experience
    let seniorityIdx;
    if (experience === 'No experience') seniorityIdx = 0;
    else if (experience === '1-3 years') seniorityIdx = random() < 0.7 ? 1 : 0;
    else if (experience === '3-6 years') seniorityIdx = random() < 0.6 ? 2 : 1;
    else seniorityIdx = random() < 0.5 ? 3 : (random() < 0.6 ? 2 : 4);

    const title = generateTitle(subcategory, seniorityIdx);
    const company = pickWeighted(COMPANY_NAMES, COMPANY_WEIGHTS);

    const id = crypto.randomUUID();
    const publishedAt = generateDate(now);

    const descTemplates = category === 'Data Science' ? DESCRIPTION_TEMPLATES.DS : DESCRIPTION_TEMPLATES.IT;
    let snippet = pick(descTemplates);
    // Ensure 50-150 chars
    if (snippet.length > 150) snippet = snippet.substring(0, 147) + '...';
    if (snippet.length < 50) snippet = snippet + ' Опыт работы обязателен.';

    jobs.push({
      id,
      title,
      company,
      category,
      subcategory,
      salary_from: salary.salary_from,
      salary_to: salary.salary_to,
      salary_currency: salary.salary_currency,
      salary_gross: salary.salary_gross,
      location,
      region,
      remote: isRemote,
      work_type: remoteType,
      experience,
      employment_type: employmentType,
      skills,
      published_at: publishedAt,
      url: `https://hh.ru/vacancy/${id.substring(0, 8)}`,
      description_snippet: snippet,
    });
  }

  return jobs;
}

// ─── Stats Computation ──────────────────────────────────────────────────────

function computeStats(jobs) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Helper: convert salary to RUB for comparison
  const RUB_RATES = { RUB: 1, USD: 90, EUR: 95 };
  function salaryToRub(from, to, currency) {
    if (from === null && to === null) return null;
    const rate = RUB_RATES[currency] || 1;
    const avg = ((from || 0) + (to || 0)) / 2;
    return Math.round(avg * rate);
  }

  // All salaries in RUB
  const salaryRubValues = jobs
    .map(j => salaryToRub(j.salary_from, j.salary_to, j.salary_currency))
    .filter(v => v !== null);

  salaryRubValues.sort((a, b) => a - b);
  const avgSalary = Math.round(salaryRubValues.reduce((a, b) => a + b, 0) / salaryRubValues.length);
  const medianSalary = salaryRubValues[Math.floor(salaryRubValues.length / 2)];

  // Remote percentage
  const remoteCount = jobs.filter(j => j.remote).length;
  const remotePct = Math.round((remoteCount / jobs.length) * 100);

  // Top skill
  const skillCounts = {};
  jobs.forEach(j => j.skills.forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));
  const topSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Top location
  const locCounts = {};
  jobs.forEach(j => { locCounts[j.region] = (locCounts[j.region] || 0) + 1; });
  const topLocation = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Date range
  const dates = jobs.map(j => new Date(j.published_at)).sort((a, b) => a - b);
  const dateFrom = dates[0].toISOString().split('T')[0];
  const dateTo = dates[dates.length - 1].toISOString().split('T')[0];

  // ─── Salary Distribution (50k increments) ────────────────────────────────
  const salaryBuckets = ['0-50k', '50k-100k', '100k-150k', '150k-200k', '200k-250k',
    '250k-300k', '300k-350k', '350k-400k', '400k-450k', '450k-500k',
    '500k-550k', '550k-600k', '600k+'];
  const salaryDistribution = salaryBuckets.map(bucket => {
    let min, max;
    if (bucket === '600k+') { min = 600000; max = Infinity; }
    else {
      const parts = bucket.replaceAll('k', '000').split('-');
      min = parseInt(parts[0]);
      max = parseInt(parts[1]);
    }
    let total = 0, ds = 0, it = 0;
    jobs.forEach(j => {
      const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
      if (rub !== null && rub >= min && rub < max) {
        total++;
        if (j.category === 'Data Science') ds++;
        else it++;
      }
    });
    return { range: bucket, count: total, data_science: ds, it };
  });

  // ─── Top 30 Skills ───────────────────────────────────────────────────────
  const skillData = {};
  jobs.forEach(j => {
    j.skills.forEach(s => {
      if (!skillData[s]) skillData[s] = { skill: s, count: 0, data_science: 0, it: 0 };
      skillData[s].count++;
      if (j.category === 'Data Science') skillData[s].data_science++;
      else skillData[s].it++;
    });
  });
  const topSkills = Object.values(skillData)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // ─── Geographic Distribution (top 15) ────────────────────────────────────
  const geoData = {};
  jobs.forEach(j => {
    if (!geoData[j.region]) geoData[j.region] = { region: j.region, count: 0, salaries: [] };
    geoData[j.region].count++;
    const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
    if (rub !== null) geoData[j.region].salaries.push(rub);
  });
  const geographicDistribution = Object.values(geoData)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map(g => ({
      region: g.region,
      count: g.count,
      avg_salary: Math.round(g.salaries.reduce((a, b) => a + b, 0) / g.salaries.length)
    }));

  // ─── Experience Distribution ──────────────────────────────────────────────
  const expData = {};
  EXPERIENCE_LEVELS.forEach(level => { expData[level] = { level, count: 0, salaries: [] }; });
  jobs.forEach(j => {
    expData[j.experience].count++;
    const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
    if (rub !== null) expData[j.experience].salaries.push(rub);
  });
  const experienceDistribution = EXPERIENCE_LEVELS.map(level => ({
    level,
    count: expData[level].count,
    avg_salary: expData[level].salaries.length > 0
      ? Math.round(expData[level].salaries.reduce((a, b) => a + b, 0) / expData[level].salaries.length)
      : 0
  }));

  // ─── Category Distribution ────────────────────────────────────────────────
  const catData = {};
  [...DS_SUBCATEGORIES, ...IT_SUBCATEGORIES].forEach(sc => { catData[sc] = { category: '', subcategory: sc, count: 0, salaries: [] }; });
  jobs.forEach(j => {
    catData[j.subcategory].category = j.category;
    catData[j.subcategory].count++;
    const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
    if (rub !== null) catData[j.subcategory].salaries.push(rub);
  });
  const categoryDistribution = Object.values(catData)
    .filter(c => c.count > 0)
    .map(c => ({
      category: c.category,
      subcategory: c.subcategory,
      count: c.count,
      avg_salary: c.salaries.length > 0
        ? Math.round(c.salaries.reduce((a, b) => a + b, 0) / c.salaries.length)
        : 0
    }))
    .sort((a, b) => b.count - a.count);

  // ─── Employment Distribution ──────────────────────────────────────────────
  const empData = {};
  EMPLOYMENT_TYPES.forEach(t => { empData[t] = { type: t, count: 0 }; });
  jobs.forEach(j => { empData[j.employment_type].count++; });
  const employmentDistribution = EMPLOYMENT_TYPES.map(t => ({ type: t, count: empData[t].count }));

  // ─── Remote Distribution ──────────────────────────────────────────────────
  const remoteDist = { 'Remote': 0, 'On-site': 0, 'Hybrid': 0 };
  jobs.forEach(j => {
    if (j.work_type === 'Remote') remoteDist['Remote']++;
    else if (j.work_type === 'Hybrid') remoteDist['Hybrid']++;
    else remoteDist['On-site']++;
  });
  const remoteDistribution = [
    { type: 'Remote', count: remoteDist['Remote'] },
    { type: 'On-site', count: remoteDist['On-site'] },
    { type: 'Hybrid', count: remoteDist['Hybrid'] }
  ];

  // ─── Timeline (daily counts) ──────────────────────────────────────────────
  const timelineData = {};
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const key = date.toISOString().split('T')[0];
    timelineData[key] = { date: key, count: 0, data_science: 0, it: 0 };
  }
  jobs.forEach(j => {
    const key = j.published_at.split('T')[0];
    if (timelineData[key]) {
      timelineData[key].count++;
      if (j.category === 'Data Science') timelineData[key].data_science++;
      else timelineData[key].it++;
    }
  });
  const timeline = Object.values(timelineData).sort((a, b) => a.date.localeCompare(b.date));

  // ─── Salary by Category ───────────────────────────────────────────────────
  const salaryByCat = {};
  [...DS_SUBCATEGORIES, ...IT_SUBCATEGORIES].forEach(sc => { salaryByCat[sc] = { category: '', subcategory: sc, salaries: [] }; });
  jobs.forEach(j => {
    salaryByCat[j.subcategory].category = j.category;
    const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
    if (rub !== null) salaryByCat[j.subcategory].salaries.push(rub);
  });
  const salaryByCategory = Object.values(salaryByCat)
    .filter(s => s.salaries.length > 0)
    .map(s => {
      const sorted = [...s.salaries].sort((a, b) => a - b);
      return {
        category: s.category,
        subcategory: s.subcategory,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
        median: sorted[Math.floor(sorted.length / 2)],
        count: sorted.length
      };
    })
    .sort((a, b) => b.count - a.count);

  // ─── Top 20 Companies ─────────────────────────────────────────────────────
  const compData = {};
  jobs.forEach(j => {
    if (!compData[j.company]) compData[j.company] = { company: j.company, count: 0, salaries: [] };
    compData[j.company].count++;
    const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
    if (rub !== null) compData[j.company].salaries.push(rub);
  });
  const topCompanies = Object.values(compData)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(c => ({
      company: c.company,
      count: c.count,
      avg_salary: c.salaries.length > 0
        ? Math.round(c.salaries.reduce((a, b) => a + b, 0) / c.salaries.length)
        : 0
    }));

  // ─── Skill Correlation (top 25) ───────────────────────────────────────────
  const skillCorr = {};
  jobs.forEach(j => {
    j.skills.forEach(s => {
      if (!skillCorr[s]) skillCorr[s] = { skill: s, data_science_count: 0, it_count: 0 };
      if (j.category === 'Data Science') skillCorr[s].data_science_count++;
      else skillCorr[s].it_count++;
    });
  });
  const skillCorrelation = Object.values(skillCorr)
    .sort((a, b) => (b.data_science_count + b.it_count) - (a.data_science_count + a.it_count))
    .slice(0, 25);

  return {
    stats: {
      total_jobs: jobs.length,
      avg_salary_rub: avgSalary,
      median_salary_rub: medianSalary,
      top_category: 'IT',
      remote_percentage: remotePct,
      top_skill: topSkill,
      top_location: topLocation,
      date_range: { from: dateFrom, to: dateTo }
    },
    salary_distribution: salaryDistribution,
    top_skills: topSkills,
    geographic_distribution: geographicDistribution,
    experience_distribution: experienceDistribution,
    category_distribution: categoryDistribution,
    employment_distribution: employmentDistribution,
    remote_distribution: remoteDistribution,
    timeline: timeline,
    salary_by_category: salaryByCategory,
    top_companies: topCompanies,
    skill_correlation: skillCorrelation
  };
}

// ─── Execute ────────────────────────────────────────────────────────────────

console.log('Generating 5000 job postings...');
const jobs = generateJobs();
console.log(`Generated ${jobs.length} jobs.`);

console.log('Computing statistics...');
const stats = computeStats(jobs);

const dataDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const jobsPath = path.join(dataDir, 'jobs.json');
const statsPath = path.join(dataDir, 'stats.json');

console.log('Writing jobs.json...');
fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));
console.log(`  Written to ${jobsPath} (${(fs.statSync(jobsPath).size / 1024 / 1024).toFixed(2)} MB)`);

console.log('Writing stats.json...');
fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
console.log(`  Written to ${statsPath} (${(fs.statSync(statsPath).size / 1024).toFixed(2)} KB)`);

// Quick validation
console.log('\n── Validation ──');
console.log(`Total jobs: ${jobs.length}`);
console.log(`DS jobs: ${jobs.filter(j => j.category === 'Data Science').length}`);
console.log(`IT jobs: ${jobs.filter(j => j.category === 'IT').length}`);
console.log(`Jobs with salary: ${jobs.filter(j => j.salary_from !== null).length}`);
console.log(`Jobs without salary: ${jobs.filter(j => j.salary_from === null).length}`);
console.log(`Remote jobs: ${jobs.filter(j => j.remote).length}`);
console.log(`Avg salary (RUB): ${stats.stats.avg_salary_rub}`);
console.log(`Median salary (RUB): ${stats.stats.median_salary_rub}`);
console.log(`Top skill: ${stats.stats.top_skill}`);
console.log(`Top location: ${stats.stats.top_location}`);
console.log(`Remote %: ${stats.stats.remote_percentage}%`);
console.log('\nDone!');
