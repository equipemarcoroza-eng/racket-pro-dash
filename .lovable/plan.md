

O usuário quer que o sistema funcione 100% com o banco Supabase (tabelas já criadas e vazias), removendo toda a dependência dos dados mockados (`mockData.ts` via `AppContext`).

## Situação atual

- Tabelas no Supabase já existem e estão vazias: `students`, `plans`, `schedule_slots`, `enrollments`, `attendance_logs`, `revenues`, `scheduled_payments`, `expense_categories`, `profiles`, `user_roles`.
- Auth e RLS prontos (admin via `has_role`).
- Mas todas as páginas (`Students`, `PlansManage`, `Schedule`, `ClassManagement`, `Attendance`, `AttendanceControl`, `Revenue`, `Expenses`, `CashFlow`, `FrequencyReport`, `Birthdays`, `Dashboard`) ainda leem/gravam no `AppContext` que carrega `mockStudents`, `mockEnrollments`, `mockRevenue`, etc.

## Objetivo

Refatorar toda a camada de dados para Supabase, começar com tudo vazio, e remover os mocks.

## Plano de execução

**1. Nova camada de dados via React Query**
- Adicionar hooks em `src/hooks/` (um por entidade): `useStudents`, `usePlans`, `useSchedule`, `useEnrollments`, `useAttendance`, `useRevenues`, `useScheduledPayments`, `useExpenseCategories`.
- Cada hook expõe `data`, `isLoading` e mutations (`create`, `update`, `remove`) usando `supabase.from(...)` + invalidação de cache.

**2. Substituir o `AppContext`**
- Remover `src/contexts/AppContext.tsx` e o `AppProvider` em `App.tsx`.
- Remover `src/data/mockData.ts` (ou esvaziar mantendo só os tipos que ainda forem úteis — provavelmente migrar tipos para `src/types/index.ts`).

**3. Refatorar cada página**
Para cada página listada acima:
- Trocar `useAppContext()` pelos hooks novos.
- Adaptar campos: snake_case do banco ↔ camelCase do código (ex.: `plano_id`, `aluno_id`, `turma_id`, `data_nascimento`).
- Substituir IDs gerados localmente (`Date.now()`) por UUIDs do banco (deixar o Supabase gerar via `gen_random_uuid()`).
- Tratar estados de `loading` e listas vazias (empty states em todas as páginas).

**4. Ajustes pontuais**
- `Dashboard`: calcular métricas a partir das queries reais; mostrar zeros quando vazio.
- `FrequencyReport` / `Birthdays`: lidar com listas vazias.
- `CashFlow`: somar `revenues` (status Pago) e `scheduled_payments` (status Pago) reais.
- Garantir que cadastro de aluno cria a fatura inicial direto na tabela `revenues`.

**5. Limpeza**
- Remover imports do `mockData` em todos os arquivos.
- Remover `AppProvider` do `App.tsx`.
- Garantir que o build passa sem referências a mocks.

## Ordem de implementação

```text
1. Criar hooks de dados (Supabase + React Query)
2. Atualizar App.tsx (remover AppProvider)
3. Migrar páginas em ordem: Plans → Students → Schedule →
   ClassManagement → Attendance/AttendanceControl →
   Revenue → Expenses → CashFlow → Dashboard →
   FrequencyReport → Birthdays
4. Deletar mockData.ts e AppContext.tsx
5. Verificar tipagem e estados vazios
```

## Resultado esperado

Sistema 100% conectado ao banco, todas as telas começando vazias, CRUD funcionando direto no Supabase com RLS de admin, sem nenhum vestígio dos dados de exemplo.

