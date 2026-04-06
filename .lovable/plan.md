

## Revisão Completa de CRUD em Todas as Telas

### Problemas Identificados

Após análise de todas as telas, os seguintes botões/ações **não funcionam**:

| Tela | Botão sem função |
|------|-----------------|
| **Alunos** | "Visualizar", "Editar", "Exportar" |
| **Agenda** | "Nova Turma", "Editar" (slot), "Cadastrar turma" (slot vazio) |
| **Despesas** | "Nova Despesa", "Adicionar Categoria", filtros de categoria, "Gerar Relatório" — nenhum estado local |
| **Receitas** | "Detalhar", "Baixar/Enviar aviso/Programar", "Registrar Recebimento Mitigado" |

**PlansManage** e **Attendance** já funcionam corretamente.

---

### Alterações por Arquivo

#### 1. `src/pages/Students.tsx`
- Adicionar estado `editingStudent` e `viewingStudent`
- **Editar**: Ao clicar, carrega os dados no formulário existente (reutilizar o form de criação com flag de edição, como em PlansManage)
- **Visualizar**: Abre um Dialog read-only com todos os dados do aluno
- **Exportar**: Gera download de CSV com os alunos filtrados
- Adicionar toast de confirmação ao salvar/excluir

#### 2. `src/pages/Schedule.tsx`
- Adicionar estado local `schedule` com `useState(mockSchedule)` (hoje usa mockSchedule diretamente sem estado)
- **Nova Turma / Cadastrar turma**: Abre Dialog com formulário (quadra, dia, horário, turmaId)
- **Editar**: Abre o mesmo Dialog preenchido com dados do slot
- Salvar adiciona/atualiza no estado local
- Popular mais dados mockados para preencher melhor a grade

#### 3. `src/pages/Expenses.tsx`
- Converter para componente com estado local (`useState` para categorias e pagamentos)
- **Nova Despesa**: Dialog com formulário (fornecedor, valor, categoria)
- **Adicionar Categoria**: Dialog simples (nome da categoria, valor inicial)
- **Filtros de categoria**: Funcionar como toggle para filtrar as categorias exibidas
- Excluir categoria e pagamento programado
- Atualizar totais dinamicamente com base no estado

#### 4. `src/pages/Revenue.tsx`
- **Detalhar**: Abre Dialog read-only com dados da receita
- **Ações por status**: "Baixar" muda status para "Pago" removido, "Enviar aviso" exibe toast, "Programar" exibe toast de confirmação
- **Registrar Recebimento Mitigado**: Abre Dialog para selecionar aluno e registrar valor parcial/total, adicionando ao estado

#### 5. `src/data/mockData.ts`
- Adicionar mais alunos mockados com horários variados (para popular melhor a agenda e presença)
- Adicionar mais dados de despesas/pagamentos para demonstrar melhor a tela

### Resumo
- 5 arquivos alterados
- Foco em tornar todos os botões existentes funcionais com operações em estado local
- Toasts de confirmação em todas as ações
- Sem mudanças de layout — apenas conectar a lógica aos botões já existentes

