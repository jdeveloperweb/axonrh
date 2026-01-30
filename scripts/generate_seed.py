import random
import uuid
from datetime import datetime, timedelta

TENANT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

DEPARTMENTS = [
    ("COM-VID", "Comercial - Vida e Previdência"),
    ("COM-SAU", "Comercial - Saúde e Odonto"),
    ("COM-AUT", "Comercial - Automóvel e Ramos Elementares"),
    ("SIN-SAU", "Sinistros - Saúde"),
    ("SIN-PEC", "Sinistros - P&C (Property & Casualty)"),
    ("OPE-IMP", "Operacional - Implantação de Grupos"),
    ("REL-COR", "Relacionamento Corporate"),
    ("REL-PME", "Relacionamento PME"),
    ("FIN-ADM", "Financeiro e Administrativo"),
    ("RH-INT", "Recursos Humanos"),
    ("TI-INO", "TI e Inovação Digital"),
    ("JUR-COM", "Jurídico e Compliance"),
    ("MKT-EXP", "Marketing e Experiência do Cliente"),
    ("AUD-MED", "Auditoria Médica e Gestão de Saúde"),
    ("RED-CRE", "Rede Credenciada e Parcerias"),
    ("DIR-EXE", "Diretoria Executiva"),
    ("FAC-MAN", "Facilities e Manutenção")
]

POSITIONS_DATA = {
    "COM-VID": [("Consultor de Vida", 4500, 8000), ("Gerente de Contas Vida", 7000, 12000)],
    "COM-SAU": [("Executivo de Vendas Saúde", 5000, 9000), ("Gestor de Benefícios", 8000, 15000)],
    "SIN-SAU": [("Analista de Sinistro Saúde", 3500, 6000), ("Coordenador de Sinistros", 7000, 10000)],
    "AUD-MED": [("Enfermeiro Auditor", 5000, 8000), ("Médico Auditor", 12000, 20000)],
    "TI-INO": [("Desenvolvedor Full Stack", 6000, 14000), ("Analista de Sistemas", 5000, 9000)],
    "DEFAULT": [("Assistente Administrativo", 2500, 4000), ("Analista Pleno", 4500, 7500), ("Gerente de Área", 9000, 16000)]
}

first_names = ["Gabriel", "Lucas", "Matheus", "Pedro", "Guilherme", "Enzo", "Felipe", "João", "Rafael", "Gustavo", "Julia", "Sofia", "Isabella", "Manuela", "Alice", "Laura", "Heloisa", "Giovanna", "Maria", "Beatriz"]
last_names = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"]

def generate_cpf():
    return f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(10, 99)}"

def generate_sql():
    sql = []
    sql.append("-- Script de carga de dados AxonRH - Corretora de Seguros")
    sql.append("SET search_path TO shared;")
    
    # Limpeza (preservando o necessário)
    sql.append("TRUNCATE employee_contracts CASCADE;")
    sql.append("TRUNCATE employee_dependents CASCADE;")
    sql.append("TRUNCATE employee_documents CASCADE;")
    sql.append("TRUNCATE employee_history CASCADE;")
    sql.append("TRUNCATE employees CASCADE;")
    sql.append("TRUNCATE positions CASCADE;")
    sql.append("TRUNCATE departments CASCADE;")
    sql.append("TRUNCATE cost_centers CASCADE;")

    # Centros de Custo (um para cada departamento simplificado)
    cc_map = {}
    for code, name in DEPARTMENTS:
        cc_id = str(uuid.uuid4())
        cc_map[code] = cc_id
        sql.append(f"INSERT INTO cost_centers (id, tenant_id, code, name, is_active) VALUES ('{cc_id}', '{TENANT_ID}', 'CC-{code}', 'Custo {name}', true);")

    # Departamentos
    dept_map = {}
    for code, name in DEPARTMENTS:
        dept_id = str(uuid.uuid4())
        dept_map[code] = dept_id
        sql.append(f"INSERT INTO departments (id, tenant_id, code, name, cost_center_id, is_active) VALUES ('{dept_id}', '{TENANT_ID}', '{code}', '{name}', '{cc_map[code]}', true);")

    # Cargos (Positions)
    pos_ids = []
    for code, dept_id in dept_map.items():
        positions = POSITIONS_DATA.get(code, POSITIONS_DATA["DEFAULT"])
        for title, min_s, max_s in positions:
            pos_id = str(uuid.uuid4())
            pos_ids.append({'id': pos_id, 'dept_id': dept_id, 'title': title, 'min': min_s, 'max': max_s})
            sql.append(f"INSERT INTO positions (id, tenant_id, code, title, department_id, salary_range_min, salary_range_max, is_active) VALUES ('{pos_id}', '{TENANT_ID}', 'POS-{pos_id[:8]}', '{title}', '{dept_id}', {min_s}, {max_s}, true);")

    # Colaboradores (120)
    employees = []
    
    # Primeiro criamos 17 gestores (um para cada dept)
    manager_ids_per_dept = {}
    for code, dept_id in dept_map.items():
        emp_id = str(uuid.uuid4())
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"{name.lower().replace(' ', '.')}@axonrh.com.br"
        # Pegar um cargo de gerente se houver, ou o último da lista
        p_list = [p for p in pos_ids if p['dept_id'] == dept_id]
        p = p_list[-1]
        
        salary = random.randint(int(p['min']), int(p['max']))
        cpf = generate_cpf()
        h_date = (datetime.now() - timedelta(days=random.randint(1000, 3000))).date()
        
        sql.append(f"INSERT INTO employees (id, tenant_id, full_name, email, cpf, birth_date, hire_date, department_id, position_id, base_salary, status, employment_type, gender) VALUES ('{emp_id}', '{TENANT_ID}', '{name}', '{email}', '{cpf}', '1980-01-01', '{h_date}', '{dept_id}', '{p['id']}', {salary}, 'ACTIVE', 'CLT', 'M' if random.random() > 0.5 else 'F');")
        manager_ids_per_dept[dept_id] = emp_id
        employees.append(emp_id)

    # Restante (103 colaboradores)
    for _ in range(103):
        emp_id = str(uuid.uuid4())
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"{name.lower().replace(' ', '.')}@axonrh.com.br"
        
        # Sorteia um departamento e um cargo dele que não seja o último (geralmente gerente)
        dept_id = random.choice(list(dept_map.values()))
        p_list = [p for p in pos_ids if p['dept_id'] == dept_id]
        p = random.choice(p_list[:-1]) if len(p_list) > 1 else p_list[0]
        
        salary = random.randint(int(p['min']), int(p['max']))
        cpf = generate_cpf()
        h_date = (datetime.now() - timedelta(days=random.randint(30, 1000))).date()
        manager_id = manager_ids_per_dept[dept_id]
        
        sql.append(f"INSERT INTO employees (id, tenant_id, full_name, email, cpf, birth_date, hire_date, department_id, position_id, manager_id, base_salary, status, employment_type) VALUES ('{emp_id}', '{TENANT_ID}', '{name}', '{email}', '{cpf}', '1995-05-10', '{h_date}', '{dept_id}', '{p['id']}', '{manager_id}', {salary}, 'ACTIVE', 'CLT');")
        employees.append(emp_id)

    # Dependentes (alguns)
    for _ in range(40):
        emp_id = random.choice(employees)
        dep_id = str(uuid.uuid4())
        sql.append(f"INSERT INTO employee_dependents (id, tenant_id, employee_id, full_name, relationship, birth_date, is_active) VALUES ('{dep_id}', '{TENANT_ID}', '{emp_id}', 'Dependente de {emp_id[:5]}', 'CHILD', '2015-01-01', true);")

    return "\n".join(sql)

if __name__ == "__main__":
    with open("c:\\Users\\Jaime.Vicente\\axonrh\\scripts\\seed_employees.sql", "w", encoding="utf-8") as f:
        f.write(generate_sql())
    print("SQL de seed gerado com sucesso!")
