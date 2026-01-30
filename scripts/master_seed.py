import random
import uuid
from datetime import datetime, timedelta

TENANT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
ADMIN_ID = 'd1111111-1111-1111-1111-111111111111'

DEPARTMENTS = [
    ("COM-VID", "Comercial - Vida"), ("COM-SAU", "Comercial - Saúde"), ("COM-AUT", "Comercial - Auto"),
    ("SIN-SAU", "Sinistros - Saúde"), ("SIN-PEC", "Sinistros - P&C"), ("OPE-IMP", "Operacional - Implantação"),
    ("REL-COR", "Relacionamento Corporate"), ("REL-PME", "Relacionamento PME"), ("FIN-ADM", "Financeiro"),
    ("RH-INT", "Recursos Humanos"), ("TI-INO", "TI e Inovação"), ("JUR-COM", "Jurídico"),
    ("MKT-EXP", "Marketing"), ("AUD-MED", "Auditoria Médica"), ("RED-CRE", "Rede Credenciada"),
    ("DIR-EXE", "Diretoria"), ("FAC-MAN", "Facilities")
]

FIRST_NAMES = ["Adriano", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Juliana", "Kevin", "Larissa", "Marcos", "Natália", "Otávio", "Patrícia", "Ricardo", "Sandra", "Thiago", "Ursula"]
LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"]

def generate_cpf():
    return f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(10, 99)}"

def generate_sql():
    sql = []
    sql.append("-- MASTER SEED - AXONRH CORRETORA FINAL\n")
    sql.append("SET search_path TO shared, public, tenant_exemplo;")
    
    # --- LIMPEZA RADICAL ---
    sql.append("DELETE FROM shared.users WHERE id != 'd1111111-1111-1111-1111-111111111111';")
    
    tables_to_truncate = [
        "shared.training_evaluations", "shared.learning_points", "shared.employee_badges", "shared.enrollments", "shared.courses", "shared.training_categories",
        "shared.feedback_records", "shared.pdi_actions", "shared.pdis", "shared.goal_updates", "shared.goals", "shared.evaluation_answers", "shared.evaluations", "shared.form_questions", "shared.form_sections", "shared.evaluation_forms", "shared.evaluation_cycles",
        "tenant_exemplo.vacation_history", "tenant_exemplo.vacation_requests", "tenant_exemplo.vacation_periods",
        "shared.daily_summaries", "shared.time_records", "shared.employee_schedules", "shared.schedule_days", "shared.work_schedules",
        "shared.employee_contracts", "shared.employee_dependents", "shared.employees", "shared.positions", "shared.departments", "shared.cost_centers",
        "public.notifications"
    ]
    for table in tables_to_truncate:
        sql.append(f"TRUNCATE {table} CASCADE;")

    # --- ESTRUTURA BASE ---
    dept_ids = {}
    for code, name in DEPARTMENTS:
        d_id = str(uuid.uuid4())
        cc_id = str(uuid.uuid4())
        dept_ids[code] = d_id
        sql.append(f"INSERT INTO shared.cost_centers (id, tenant_id, code, name) VALUES ('{cc_id}', '{TENANT_ID}', 'CC-{code}', 'Custo {name}');")
        sql.append(f"INSERT INTO shared.departments (id, tenant_id, code, name, cost_center_id) VALUES ('{d_id}', '{TENANT_ID}', '{code}', '{name}', '{cc_id}');")

    # Positions
    pos_ids = []
    for code, d_id in dept_ids.items():
        for i, title in enumerate(["Assistente", "Analista", "Gerente"]):
            p_id = str(uuid.uuid4())
            pos_ids.append((p_id, d_id, title))
            sql.append(f"INSERT INTO shared.positions (id, tenant_id, code, title, department_id) VALUES ('{p_id}', '{TENANT_ID}', 'POS-{p_id[:8]}', '{title} {DEPARTMENTS[list(dept_ids.keys()).index(code)][1]}', '{d_id}');")

    # --- COLABORADORES ---
    employee_list = []
    managers = {}
    
    for code, d_id in dept_ids.items():
        emp_id = str(uuid.uuid4())
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        email = f"{name.lower().replace(' ', '.')}@axonrh.com.br"
        p_id = [p[0] for p in pos_ids if p[1] == d_id and "Gerente" in p[2]][0]
        
        sql.append(f"INSERT INTO shared.employees (id, tenant_id, full_name, email, cpf, birth_date, hire_date, department_id, position_id, status, employment_type) VALUES ('{emp_id}', '{TENANT_ID}', '{name}', '{email}', '{generate_cpf()}', '1980-01-01', '2020-01-10', '{d_id}', '{p_id}', 'ACTIVE', 'CLT');")
        managers[d_id] = emp_id
        employee_list.append(emp_id)

    for i in range(103):
        emp_id = str(uuid.uuid4())
        d_id = random.choice(list(dept_ids.values()))
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        email = f"{name.lower().replace(' ', '.')}@axonrh.com.br"
        # Garantir que pegamos um cargo que não seja o Gerente para os funcionários comuns
        available_pos = [p[0] for p in pos_ids if p[1] == d_id and "Gerente" not in p[2]]
        p_id = random.choice(available_pos) if available_pos else [p[0] for p in pos_ids if p[1] == d_id][0]
        
        sql.append(f"INSERT INTO shared.employees (id, tenant_id, full_name, email, cpf, birth_date, hire_date, department_id, position_id, manager_id, status, employment_type) VALUES ('{emp_id}', '{TENANT_ID}', '{name}', '{email}', '{generate_cpf()}', '1990-01-01', '2023-01-01', '{d_id}', '{p_id}', '{managers[d_id]}', 'ACTIVE', 'CLT');")
        employee_list.append(emp_id)

    # --- PONTO ---
    ws_id = str(uuid.uuid4())
    sql.append(f"INSERT INTO shared.work_schedules (id, tenant_id, name, schedule_type, weekly_hours_minutes) VALUES ('{ws_id}', '{TENANT_ID}', 'Comercial Padrão', 'FIXED', 2640);")
    for day in ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]:
        sql.append(f"INSERT INTO shared.schedule_days (work_schedule_id, day_of_week, entry_time, exit_time) VALUES ('{ws_id}', '{day}', '08:00', '18:00');")

    for emp_id in employee_list[:30]:
        sql.append(f"INSERT INTO shared.employee_schedules (tenant_id, employee_id, work_schedule_id, valid_from) VALUES ('{TENANT_ID}', '{emp_id}', '{ws_id}', '2025-01-01');")
        for d in range(19, 24):
            date = f"2026-01-{d}"
            sql.append(f"INSERT INTO shared.time_records (tenant_id, employee_id, record_date, record_time, record_datetime, record_type, source) VALUES ('{TENANT_ID}', '{emp_id}', '{date}', '08:00', '{date} 08:00:00', 'ENTRY', 'WEB');")
            sql.append(f"INSERT INTO shared.time_records (tenant_id, employee_id, record_date, record_time, record_datetime, record_type, source) VALUES ('{TENANT_ID}', '{emp_id}', '{date}', '18:00', '{date} 18:00:00', 'EXIT', 'WEB');")

    # --- FÉRIAS (TENANT_EXEMPLO) ---
    for emp_id in employee_list[:15]:
        v_id = str(uuid.uuid4())
        sql.append(f"INSERT INTO tenant_exemplo.vacation_periods (id, tenant_id, employee_id, acquisition_start_date, acquisition_end_date, concession_start_date, concession_end_date, total_days, status) VALUES ('{v_id}', '{TENANT_ID}', '{emp_id}', '2024-01-01', '2024-12-31', '2025-01-01', '2025-12-31', 30, 'OPEN');")

    # --- PERFORMANCE & LEARNING ---
    # (Simplified for briefness but complete schemas)
    cat_id = str(uuid.uuid4())
    sql.append(f"INSERT INTO shared.training_categories (id, tenant_id, name) VALUES ('{cat_id}', '{TENANT_ID}', 'Seguros');")
    course_id = str(uuid.uuid4())
    sql.append(f"INSERT INTO shared.courses (id, tenant_id, category_id, title, course_type, status) VALUES ('{course_id}', '{TENANT_ID}', '{cat_id}', 'Introdução a Benefícios Saúde', 'ONLINE', 'PUBLISHED');")
    for emp_id in employee_list[:10]:
        sql.append(f"INSERT INTO shared.enrollments (tenant_id, course_id, employee_id, status) VALUES ('{TENANT_ID}', '{course_id}', '{emp_id}', 'ENROLLED');")

    return "\n".join(sql)

if __name__ == "__main__":
    with open("c:\\Users\\Jaime.Vicente\\axonrh\\scripts\\master_seed_v2.sql", "w", encoding="utf-8") as f:
        f.write(generate_sql())
    print("Seed V2 gerado!")
