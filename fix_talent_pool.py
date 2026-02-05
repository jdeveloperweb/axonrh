import re

# Ler o arquivo
with open(r'frontend\web\src\app\(dashboard)\talent-pool\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituições
# 1. Trocar setSubmitting por setActionLoading no handleVacancyAction
content = re.sub(
    r'(const handleVacancyAction.*?try \{)\s+setSubmitting\(true\);',
    r'\1\n            setActionLoading(true);',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'(if \(!confirmed\) \{)\s+setSubmitting\(false\);',
    r'\1\n                    setActionLoading(false);',
    content
)

content = re.sub(
    r"(case 'publish':.*?await talentPoolApi\.publishVacancy\(vacancyId\);)\s+toast\(\{ title: 'Sucesso', description: 'Vaga publicada com sucesso' \}\);",
    r"\1\n                    toast({ \n                        title: 'Vaga Publicada!', \n                        description: 'A vaga está agora visível publicamente na internet e candidatos podem se inscrever.' \n                    });",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'(\} finally \{)\s+setSubmitting\(false\);\s+\}\s+\};\s+(const copyPublicLink)',
    r'\1\n            setActionLoading(false);\n        }\n    };\n\n    \2',
    content
)

# Salvar
with open(r'frontend\web\src\app\(dashboard)\talent-pool\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Arquivo atualizado com sucesso!")
