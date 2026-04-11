

## Restringir campo Vencimento a dias específicos

### Alteração

**`src/pages/Students.tsx`**: Substituir o `Input` de texto do campo "Vencimento" por um `Select` com as opções fixas: `05`, `10`, `15`, `20`, `25`, `30`.

- Atualizar `emptyForm` para `vencimento: ""` (já está assim)
- Trocar o `<Input>` por `<Select>` com 6 `<SelectItem>`
- Adicionar validação no `handleSave`: se `!form.vencimento`, mostrar toast de erro

**`src/data/mockData.ts`**: Atualizar os valores de `vencimento` nos `mockStudents` para usar apenas esses dias (ex: `"05"`, `"10"`, etc.), removendo o formato antigo `"05/11"`.

