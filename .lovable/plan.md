

## Redesenhar Modal de Presença conforme Layout de Referência

### O que muda

O modal atual é funcional mas tem um layout diferente da referência. Precisa ser reestruturado para seguir exatamente o modelo enviado, que tem duas seções (cards) distintas dentro do dialog.

### Layout da Referência (estrutura)

```text
┌─────────────────────────────────────────────────────┐
│ Controle                                            │
│ Presença da Turma          [Turma SE01] [Horário]   │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Lista de Chamada                                │ │
│ │ Horário Matutino          [Registrar Presença]  │ │
│ │                                                 │ │
│ │ ┌─ Header ─────────────────────────────────────┐│ │
│ │ │ Aluno          Presença        Status        ││ │
│ │ │ Nome Completo  Marcador        Atualizado    ││ │
│ │ └──────────────────────────────────────────────┘│ │
│ │                                                 │ │
│ │ ┌─ Row ────────────────────────────────────────┐│ │
│ │ │ Aluno                                        ││ │
│ │ │ Mariana Costa    [Presente] [Falta]   08:05  ││ │
│ │ └──────────────────────────────────────────────┘│ │
│ │ (mais linhas...)                                │ │
│ │                                                 │ │
│ │ ┌─ Footer ─────────────────────────────────────┐│ │
│ │ │ Resumo diário        Total registrado: X     ││ │
│ │ └──────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Alterações

**`src/pages/Schedule.tsx`** - Redesenhar o Dialog de presença:

1. **Aumentar o modal** (`sm:max-w-3xl`) para acomodar o layout mais espaçoso
2. **Header**: Adicionar label "Controle" acima de "Presença da Turma", mover badges para a direita
3. **Card interna "Lista de Chamada"**: Nova seção com subtítulo "Horário Matutino" e botão "Registrar Presença" alinhado à direita
4. **Header da tabela**: Linha cinza com colunas "Aluno / Nome Completo", "Presença / Marcador", "Status / Atualizado"
5. **Linhas de aluno**: Cada aluno em um card com label "Aluno" + nome, botões "Presente"/"Falta", e timestamp (horário do registro extraído do mockAttendance ou hora atual)
6. **Footer**: Barra cinza com "Resumo diário" à esquerda e "Total registrado: X alunos" à direita

**`src/data/mockData.ts`** - Sem alterações (já possui `mockAttendance` com timestamps)

### Detalhes técnicos
- O turno ("Horário Matutino"/"Vespertino"/"Noturno") será inferido do horário do slot (antes das 12h = Matutino, 12-18h = Vespertino, depois = Noturno)
- Os timestamps mostrados ao lado dos botões usarão a hora atual formatada quando o aluno for marcado
- Manter toda a lógica existente de filtragem e toggle, apenas mudar a apresentação visual

