# Regularização das presenças — 1º semestre de 2026

## Objetivo
Regularizar `attendance_logs` entre **01/01/2026 e 30/06/2026** somente para alunos atualmente com status **Ativo**, sem alterar qualquer registro dos quatro alunos excluídos.

## Ajuste proposto
1. Executar uma única operação transacional no banco para que toda a correção seja aplicada por completo ou revertida em caso de erro.
2. Selecionar alunos ativos, excluindo explicitamente e pelo nome:
   - Cinthya Thom
   - Rodrigo Clemente de Souza
   - Larissa Crema
   - Theo Peraro
3. Atualizar para **Presente** os registros existentes no semestre cujo valor real na base seja **Falta** ou **Cancelado**.
4. Gerar os dias esperados de aula de cada matrícula usando:
   - a turma vinculada em `enrollments`;
   - o dia da semana definido em `schedule_slots`;
   - o início em `GREATEST(data_entrada, 2026-01-01)`;
   - o término em `2026-06-30`.
5. Inserir como **Presente** apenas combinações de aluno, turma e data ainda inexistentes em `attendance_logs`.
6. Verificar após a execução:
   - nenhuma lacuna restante para os alunos elegíveis;
   - nenhuma duplicidade por aluno, turma e data;
   - nenhum registro dos quatro alunos excluídos alterado ou inserido;
   - totais efetivamente atualizados e inseridos.

## Situação confirmada antes da execução
- A base usa **Falta** como valor gravado para o que a tela chama de “Ausente”.
- Existem atualmente **891** registros elegíveis com `Falta` ou `Cancelado`.
- Existem atualmente **280** registros faltantes, distribuídos entre **34** alunos ativos elegíveis.
- Não há duplicidades atuais por aluno, turma e data.

## Detalhes técnicos
Será usado um ajuste de dados, não uma mudança estrutural. A inserção será protegida com `NOT EXISTS`, e as exclusões serão aplicadas tanto na atualização quanto na geração das novas presenças.
