

## Atualizar opções de Frequência nos Planos

### Alterações

**`src/pages/PlansManage.tsx`** (linha 62-65): Substituir as opções "Diária" e "Semanal" por:
- "1x por semana"
- "2x por semana"
- "3x por semana"

Atualizar o valor default do form de `"Diária"` para `"1x por semana"`.

**`src/data/mockData.ts`**: Atualizar os valores de `frequencia` nos mockPlans para usar as novas opções.

