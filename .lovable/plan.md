

## Gerar Parcelas do Mês Corrente - Contas a Receber

### O que será feito

Adicionar um botão "Gerar Parcelas do Mês" na tela de Contas a Receber. Ao clicar, o sistema percorre todos os alunos com status "Ativo", e para cada um cria uma nova parcela (Revenue) com:
- **Aluno**: nome do aluno
- **Plano**: "Mensalidade"
- **Valor**: valor do primeiro plano cadastrado (R$ 120,00 como padrão, já que alunos não têm plano vinculado)
- **Vencimento**: dia extraído do campo `vencimento` do aluno (ex: "05/11" → dia 05) + mês/ano corrente
- **Status**: "Gerada"

Parcelas já existentes para o mesmo aluno no mesmo mês não serão duplicadas.

### Alterações nos arquivos

**1. `src/pages/Revenue.tsx`**
- Converter `mockRevenue` de import estático para estado local (`useState`)
- Adicionar botão "Gerar Parcelas do Mês" no header, ao lado dos botões existentes
- Implementar função `gerarParcelas` que:
  1. Obtém mês/ano corrente
  2. Filtra `mockStudents` por `status === "Ativo"`
  3. Para cada aluno ativo, extrai o dia do campo `vencimento` (parte antes da `/`)
  4. Monta a data de vencimento: `dd/MM/AAAA` com mês e ano atuais
  5. Verifica se já existe parcela para esse aluno no mês corrente (evitar duplicatas)
  6. Cria entrada Revenue com status "Gerada" e valor padrão do plano
  7. Adiciona ao estado local
- Exibir toast de confirmação com quantidade de parcelas geradas

**2. `src/data/mockData.ts`**
- Adicionar campo opcional `planoId` na interface `Student` para vincular ao plano (ou usar valor padrão do primeiro plano)

### Observação sobre valor
Como os alunos atualmente não possuem um plano vinculado, o valor será o do primeiro plano cadastrado (Plano Básico, R$ 120). Futuramente pode-se vincular cada aluno a um plano específico.

