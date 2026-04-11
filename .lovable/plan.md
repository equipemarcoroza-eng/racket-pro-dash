

## Reestruturação: Controle de Turmas, Presença e Frequência

### Resumo

Criar 3 novas telas no menu lateral + alterar a Agenda para mostrar datas. O modelo atual de turmas muda fundamentalmente: alunos são **matriculados** em turmas específicas (dia/horário/quadra), respeitando limite de 6 e frequência do plano.

### Modelo de Dados (`src/data/mockData.ts`)

Nova interface central — **Enrollment** (matrícula do aluno em turmas):

```text
interface Enrollment {
  id: string;
  alunoId: string;
  turmaId: string;  // referência ao ClassSlot.id
}
```

- Cada aluno ativo tem N enrollments, onde N = frequência do plano (1, 2 ou 3)
- `ClassSlot` passa a ter limite fixo de 6 alunos (contagem derivada dos enrollments)
- Adicionar `mockEnrollments` com dados iniciais distribuídos entre os slots

Nova interface — **AttendanceLog** (registro persistente de presença):

```text
interface AttendanceLog {
  id: string;
  alunoId: string;
  turmaId: string;
  data: string;       // "2026-04-07"
  presente: boolean;
}
```

- Adicionar `mockAttendanceLogs` com registros de exemplo para abril/2026

### 1. Controle de Turmas (`src/pages/ClassManagement.tsx`) — Nova tela

Menu: "Controle de Turmas" (ícone `Users`)

Funcionalidades:
- Lista todos os alunos ativos com plano, frequência e turmas matriculadas
- **Matricular aluno**: seleciona aluno → exibe N selects (conforme frequência do plano), cada um com par Dia + Horário + Quadra
- Validação: slot não pode ter mais de 6 alunos matriculados
- **Alterar horários**: editar as turmas de um aluno, só permitindo slots com vagas (<6)
- **Aluno inativo**: ao marcar como inativo (em Students.tsx), remover automaticamente seus enrollments, liberando vagas
- Exibir badge de lotação (ex: "5/6", "6/6 - Lotada") por turma

### 2. Controle de Presença (`src/pages/AttendanceControl.tsx`) — Nova tela

Menu: "Controle de Presença" (ícone `ClipboardCheck`)

Funcionalidades:
- Selecionar data (padrão: hoje) e ver todas as turmas daquele dia da semana
- Para cada turma: listar alunos **matriculados** (via enrollments), marcar Presente/Falta
- Salvar grava em `attendanceLogs` (estado local)
- Layout similar ao modal atual de presença mas como página completa
- Indicador visual de turmas já lançadas vs pendentes naquele dia

### 3. Consulta de Frequência (`src/pages/FrequencyReport.tsx`) — Nova tela

Menu: "Frequência" (ícone `BarChart3`)

Funcionalidades:
- Filtro: selecionar mês/ano e aluno ativo
- Tabela mensal mostrando cada data de aula do aluno, com: data, turma (ID), horário, quadra, status (Presente/Ausente/Não lançado)
- Resumo: total de aulas, presenças, faltas, % de frequência
- As datas são calculadas com base nos dias da semana das turmas matriculadas dentro do mês selecionado

### 4. Alteração na Agenda (`src/pages/Schedule.tsx`)

- Calcular as datas reais da semana atual (Seg a Dom) e exibir abaixo de cada dia no cabeçalho da grade: ex. "Seg" + "07/04"
- Contagem de alunos em cada slot derivada dos enrollments (não mais campo estático)
- Exibir "X/6" em vez de apenas "X alunos"
- Remover o modal de presença da Agenda (movido para tela própria)

### 5. Menu (`src/components/AppLayout.tsx`)

Adicionar 3 itens ao `navItems`:
- `/classes` → "Controle de Turmas"
- `/attendance` → "Controle de Presença"  
- `/frequency` → "Frequência"

### 6. Rotas (`src/App.tsx`)

Adicionar as 3 rotas novas. Remover rota antiga `/attendance/:classId`.

### Arquivos alterados/criados

| Arquivo | Ação |
|---------|------|
| `src/data/mockData.ts` | Adicionar Enrollment, AttendanceLog + mocks |
| `src/pages/ClassManagement.tsx` | Criar |
| `src/pages/AttendanceControl.tsx` | Criar |
| `src/pages/FrequencyReport.tsx` | Criar |
| `src/pages/Schedule.tsx` | Alterar (datas, contagem via enrollments) |
| `src/components/AppLayout.tsx` | Adicionar 3 itens no menu |
| `src/App.tsx` | Adicionar 3 rotas, remover rota antiga |
| `src/pages/Students.tsx` | Ao inativar aluno, limpar enrollments |

