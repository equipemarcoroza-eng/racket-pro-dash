

## Substituir campo "Horário" por "Plano" na Tabela de Alunos

### O que será feito

Substituir o campo `horario` por `planoId` na interface `Student` e em toda a tela de Alunos. O campo "Plano" será um Select que lista os planos cadastrados em `mockPlans`, criando a vinculação entre aluno e plano.

### Alterações

**1. `src/data/mockData.ts`**
- Na interface `Student`: remover `horario: string`, adicionar `planoId: string`
- Nos `mockStudents`: substituir o campo `horario` por `planoId` referenciando os IDs dos planos existentes ("1", "2" ou "3")

**2. `src/pages/Students.tsx`**
- Importar `mockPlans` de `mockData`
- No `emptyForm`: trocar `horario` por `planoId: ""`
- No formulário: substituir o Input de "Horário" por um Select "Plano" que lista `mockPlans` (exibindo `nome` do plano, guardando `id`)
- Na tabela: coluna "Horário" vira "Plano", exibindo o nome do plano via lookup em `mockPlans`
- No Dialog de visualização: trocar "Horário" por "Plano" com o nome resolvido
- No CSV de exportação: trocar coluna "Horário" por "Plano"
- No `openEdit`: mapear `planoId` em vez de `horario`

**3. `src/pages/Schedule.tsx`** (ajuste menor)
- A lógica de presença que filtrava alunos por `horario` precisará ser ajustada para usar o turno do plano vinculado, ou manter compatibilidade

### Resultado
- O aluno passa a ter um plano vinculado, visível na tabela e no formulário
- A seleção é feita via dropdown com os planos cadastrados

