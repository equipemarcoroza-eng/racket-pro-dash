# Corrigir build e persistência de Receitas

## Objetivo
Resolver os 2 erros de build e garantir que recebíveis (incluindo avulsos) sejam persistidos no Lovable Cloud.

## Mudanças

### 1. `src/contexts/AppContext.tsx`
- Remover o estado `lastSyncedRevenues`.
- Remover o `useEffect` "Sync Engine" (linhas 251–271) que referencia `toast` inexistente (causa do TS2304).
- Substituir o `setRevenues` customizado (que só atualiza estado local) por:
  `const setRevenues = makeSetter(revenues, setRevenuesState, "revenues", revenueToDb);`
- Remover a linha `setLastSyncedRevenues(loadedRevenues)` no carregamento inicial.

Resultado: cada criação/edição/exclusão de receita dispara INSERT/UPDATE/DELETE imediatamente na tabela `revenues`, igual às demais entidades.

### 2. `src/pages/Revenue.tsx` (linha 254)
- Adicionar `alunoId: ""` no reset de `setAvulsoForm` para corresponder ao tipo do estado e eliminar o erro TS2345.

## Resultado esperado
- Build passa sem erros.
- Recebíveis avulsos criados em qualquer mês/ano são salvos no banco e permanecem após refresh.