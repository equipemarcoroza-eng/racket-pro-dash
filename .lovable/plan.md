

## Controle de Presença dentro da Agenda

### Resumo

Adicionar um botão "Presença" em cada slot da grade semanal que abre um **Dialog (modal)** com a lista de chamada dos alunos daquela turma, seguindo o layout da imagem de referência. O modal permite marcar Presente/Falta e registrar a presença sem sair da tela de Agenda.

### Alterações

**1. `src/pages/Schedule.tsx`**
- Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` do shadcn
- Adicionar estado para controlar qual slot está aberto (`selectedSlot`) e os registros de presença desse slot
- Em cada slot preenchido, adicionar botão **"Presença"** ao lado de "Editar"
- Ao clicar, abrir o Dialog com:
  - Header: "Presença da Turma" + badges "Turma {turmaId}" e "Horário {horario}"
  - Lista de chamada com alunos mockados (filtrados pelo horário do slot, usando `mockStudents` que tenham o mesmo `horario`)
  - Botões "Presente" / "Falta" para cada aluno (toggle visual)
  - Botão "Registrar Presença" que fecha o modal com toast de confirmação
  - Rodapé com resumo: "Total registrado: X alunos"

**2. `src/data/mockData.ts`**
- Sem alterações estruturais. Os alunos serão filtrados pelo campo `horario` existente para popular a lista de chamada de cada slot.

### Comportamento
- O filtro de alunos usa o campo `horario` do `mockStudents` comparado ao horário do slot (ex: slot "08:00" mostra alunos com horário "08h00")
- Se nenhum aluno corresponder ao horário, exibe mensagem "Nenhum aluno cadastrado neste horário"
- O estado de presença é local ao modal (não persiste entre aberturas, dado que são dados mockados)

