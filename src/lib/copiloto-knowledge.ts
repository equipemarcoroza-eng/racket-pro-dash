/**
 * Base de Conhecimento do Copiloto IA • Equipe Marco Roza Beach Tennis
 * Treinado na metodologia de engenharia de software e inteligência esportiva
 * Desenvolvido por Anderson Diroza (Gêmeo Digital) para a Equipe Marco Roza
 */

export interface RespostaCopiloto {
  texto: string;
  rotaSugerida?: string;
  labelRota?: string;
  acaoEspecial?: "abrir_agendamento" | "abrir_telegram";
  topicosRelacionados?: string[];
  linkExterno?: {
    label: string;
    url: string;
  };
}

export interface IntencaoCopiloto {
  chaves: string[];
  resposta: RespostaCopiloto;
}

export const TELEGRAM_CONCIERGE_URL = "https://t.me/diroza_concierge_bot?start=marco_roza";
export const WHATSAPP_ANDERSON_URL = "https://wa.me/5548988455454";

export const BASE_CONHECIMENTO: IntencaoCopiloto[] = [
  // 1. SUPORTE CONCIERGE DO TELEGRAM 24/7 (Prioritário)
  {
    chaves: [
      "telegram",
      "suporte",
      "concierge",
      "bot",
      "humano",
      "atendente",
      "chamar anderson",
      "falar com anderson",
      "falar com o anderson",
      "escalar",
      "duvida tecnica",
      "erro",
      "bug",
      "print",
      "foto",
      "audio",
      "24/7",
      "24 horas",
      "sustentacao",
      "manutencao",
      "ajuda",
      "suporte tecnico",
      "diroza concierge",
    ],
    resposta: {
      texto:
        "A plataforma da **Equipe Marco Roza Beach Tennis** conta com canal oficial de **Suporte Executivo & Concierge 24/7 no Telegram** (`@diroza_concierge_bot`), conectado diretamente à nossa infraestrutura.\n\n" +
        "• **Atendimento Instantâneo com IA:** Treinado em todas as regras operacionais, turmas, quadras, finanças e telas da arena.\n" +
        "• **Envio de Prints & Áudios:** Sua equipe de recepção e professores podem encaminhar fotos da quadra, capturas de tela ou mensagens de voz sobre qualquer dúvida.\n" +
        "• **Escalada Imediata no Bolso do Anderson Diroza:** Notificação de alta prioridade enviada ao celular do Anderson caso necessite de suporte técnico avançado.\n" +
        "• **Sincronização Contínua de Melhorias:** Qualquer nova evolução implementada no código é assimilada pelo bot em tempo real.",
      acaoEspecial: "abrir_telegram",
      topicosRelacionados: [
        "Agendar Reunião com Anderson",
        "Modo TV / Arena Live",
        "BI Financeiro",
        "Card do Atleta",
      ],
      linkExterno: {
        label: "Abrir Suporte Concierge no Telegram (@diroza_concierge_bot)",
        url: TELEGRAM_CONCIERGE_URL,
      },
    },
  },

  // 2. REUNIÃO DE ALINHAMENTO COM ANDERSON DIROZA
  {
    chaves: [
      "reuniao",
      "alinhamento",
      "agendar",
      "marcar",
      "conversar com anderson",
      "anderson diroza",
      "meet",
      "google meet",
      "google calendar",
      "proposta",
      "comercial",
      "evolucao",
      "novas funcionalidades",
      "modulo novo",
      "gemeo digital",
    ],
    resposta: {
      texto:
        "Fico muito feliz com seu contato! Como você já possui contrato ativo e conta com o **Suporte Concierge Exclusivo da Equipe Marco Roza Beach Tennis**, podemos agendar uma **Reunião de Alinhamento Executivo & Suporte Estratégico** (estritamente **1 hora inteira**) diretamente com o **Anderson Diroza**.\n\n" +
        "Você pode escolher o melhor dia e horário diretamente na **agenda oficial do Google Calendar** (**andersondiroza@gmail.com**) com garantia de **Conflito Zero** e geração automática da sua sala exclusiva no **Google Meet**. Veja o convite oficial logo abaixo:",
      acaoEspecial: "abrir_agendamento",
      topicosRelacionados: [
        "Suporte Concierge no Telegram",
        "Modo TV / Arena Live",
        "BI Financeiro",
        "Simulador What-If",
      ],
    },
  },

  // 3. MODO TV / ARENA LIVE KIOSK
  {
    chaves: [
      "arena live",
      "modo tv",
      "tv",
      "kiosk",
      "telao",
      "troca de turmas",
      "sirene",
      "aviso sonoro",
      "relogio",
      "quadra ao vivo",
      "aniversariantes na tv",
      "tempo real",
    ],
    resposta: {
      texto:
        "O **Modo TV / Arena Live** (`/arena-live`) foi desenhado especificamente para telas grandes e televisores instalados na recepção ou beira de quadra da arena:\n\n" +
        "• **Aviso Sonoro de Troca de Turmas:** Sirene acústica e alerta aos 5 minutos finais de cada hora para orientar alunos e professores sem atrasos.\n" +
        "• **Grade de Quadras em Tempo Real:** Visualização dinâmica dos treinos que estão acontecendo e dos próximos horários agendados.\n" +
        "• **Aniversariantes do Dia:** Homenagem automática aos alunos atletas aniversariantes, gerando conexão emocional e engajamento.\n" +
        "• **Layout de Alta Visibilidade:** Contraste calibrado para visualização nítida à distância e sob luz solar da arena.",
      rotaSugerida: "/arena-live",
      labelRota: "Abrir Modo TV / Arena Live",
      topicosRelacionados: [
        "Agenda de Quadras",
        "Controle de Turmas",
        "Card do Atleta",
      ],
    },
  },

  // 4. BI FINANCEIRO & TERMÔMETROS DE VIDRO
  {
    chaves: [
      "bi financeiro",
      "termometros de vidro",
      "faturamento",
      "receita total",
      "ticket medio",
      "indicadores financeiros",
      "historico bi",
      "margem",
      "glassmorphism",
      "bi history",
      "financeiro bi",
    ],
    resposta: {
      texto:
        "O **BI Financeiro** (`/bi-history`) consolida a inteligência executiva de faturamento da **Equipe Marco Roza**:\n\n" +
        "• **Termômetros de Vidro (Glassmorphism):** Visão estética e instantânea de Receita Total, Ticket Médio por Aluno e Ocupação de Mensalidades.\n" +
        "• **Evolução Histórica Mês a Mês:** Gráficos interativos de crescimento, sazonalidade de matrículas e comparativos temporais.\n" +
        "• **Compatibilidade com Modo Discreto:** Os termômetros permanecem elegantes e com dados protegidos para privacidade na recepção.\n" +
        "• **Métricas de Lucratividade:** Visão líquida cruzando receitas recorrentes e despesas operacionais da arena.",
      rotaSugerida: "/bi-history",
      labelRota: "Abrir BI Financeiro",
      topicosRelacionados: [
        "BI Comportamental",
        "Simulador What-If",
        "Modo Discreto",
        "Fluxo de Caixa",
      ],
    },
  },

  // 5. BI COMPORTAMENTAL & RETENÇÃO
  {
    chaves: [
      "bi comportamental",
      "comportamento",
      "perfil dos alunos",
      "distribuicao de niveis",
      "iniciante intermediario avancado",
      "genero",
      "faixa etaria",
      "retencao",
      "churn rate",
      "nps",
    ],
    resposta: {
      texto:
        "O **BI Comportamental** (`/bi-dashboard`) analisa o perfil técnico e a dinâmica dos alunos atletas da arena:\n\n" +
        "• **Distribuição por Categoria:** Percentual de alunos nos níveis Iniciante, Intermediário e Avançado para planejar turmas ideais.\n" +
        "• **Assiduidade & Frequência Média:** Indicador de fidelidade e hábitos de treino dos praticantes.\n" +
        "• **Composição por Gênero & Turno:** Apoio na formação de turmas masculinas, femininas ou mistas nos turnos manhã, tarde e noite.\n" +
        "• **Retenção Preventiva:** Identificação antecipada de turmas com oscilação de presença.",
      rotaSugerida: "/bi-dashboard",
      labelRota: "Abrir BI Comportamental",
      topicosRelacionados: [
        "BI Financeiro",
        "Radar de Churn",
        "Card do Atleta",
        "Controle de Turmas",
      ],
    },
  },

  // 6. GESTÃO DE ALUNOS & CARD DO ATLETA (XP, STREAK, ON FIRE)
  {
    chaves: [
      "alunos",
      "cadastro de alunos",
      "card do atleta",
      "streak",
      "on fire",
      "temporada xp",
      "gamificacao",
      "conquistas",
      "perfil do aluno",
      "whatsapp aluno",
      "dados do atleta",
    ],
    resposta: {
      texto:
        "O módulo de **Alunos** (`/students`) conta com a tecnologia exclusiva do **Card do Atleta Interativo**:\n\n" +
        "• **Streak de Presença:** Contador dinâmico de semanas consecutivas sem faltas aos treinos.\n" +
        "• **Status ON FIRE 🔥:** Badge de destaque para atletas engajados com assiduidade superior a 90%.\n" +
        "• **Temporada XP:** Sistema de progressão e pontuação por treinos concluídos, avaliações e assiduidade.\n" +
        "• **Atalho Direto para WhatsApp:** Disparo de mensagens personalizadas em 1 clique para alinhamento pedagógico ou lembretes.\n" +
        "• **Ficha Técnica Completa:** Histórico de frequência, plano contratado, nível técnico e reposições pendentes.",
      rotaSugerida: "/students",
      labelRota: "Abrir Gestão de Alunos",
      topicosRelacionados: [
        "Radar de Churn",
        "Controle de Presença",
        "Reposição de Aulas",
        "Provas",
      ],
    },
  },

  // 7. RADAR DE CHURN PREDITIVO
  {
    chaves: [
      "radar de churn",
      "churn",
      "evasao",
      "desistencia",
      "risco de cancelamento",
      "aluno sumido",
      "faltas consecutivas",
      "alerta de churn",
      "retencao de alunos",
    ],
    resposta: {
      texto:
        "O **Radar de Churn** é o mecanismo preditivo da plataforma para blindar a receita recorrente da arena:\n\n" +
        "• **Deteção de Padrões de Risco:** Identifica alunos com queda súbita na frequência ou 2 a 3 faltas consecutivas sem aviso prévio.\n" +
        "• **Classificação de Criticidade:** Badges coloridos (Risco Alto, Médio e Atenção) para priorizar a atuação da coordenação.\n" +
        "• **Plano de Reengajamento por WhatsApp:** Script e link direto para convidar o aluno para aula de reposição ou evento especial antes do cancelamento formal.\n" +
        "• **Redução de Evasão:** Maximiza o LTV (Lifetime Value) dos alunos na arena.",
      rotaSugerida: "/students",
      labelRota: "Ver Alunos & Radar de Churn",
      topicosRelacionados: [
        "Card do Atleta",
        "Frequência",
        "Reposição de Aulas",
        "BI Comportamental",
      ],
    },
  },

  // 8. AGENDA DE QUADRAS & SÁBADOS
  {
    chaves: [
      "agenda",
      "grade",
      "grade horaria",
      "horarios",
      "quadras",
      "sabados",
      "sabado",
      "locacao de quadras",
      "disponibilidade",
      "horario de aula",
      "schedule",
    ],
    resposta: {
      texto:
        "A **Agenda de Quadras** (`/schedule`) gerencia toda a malha operacional da **Equipe Marco Roza**:\n\n" +
        "• **Grade de Segunda a Sábado:** Cobertura horária completa das 06:00 às 22:00, incluindo suporte oficial aos sábados.\n" +
        "• **Filtros Ágeis:** Visualização por dia, quadra específica ou por professor responsável.\n" +
        "• **Ocupação Visual das Quadras:** Cores intuitivas indicando turmas em andamento, livres para locação ou lotadas.\n" +
        "• **Integração com Plano de Aulas:** Permite abrir a prancheta do treino do dia direto pelo slot da agenda.",
      rotaSugerida: "/schedule",
      labelRota: "Abrir Agenda de Quadras",
      topicosRelacionados: [
        "Controle de Turmas",
        "Modo TV / Arena Live",
        "Plano de Aulas",
        "Controle de Presença",
      ],
    },
  },

  // 9. CONTROLE DE TURMAS & CAPACIDADE
  {
    chaves: [
      "turmas",
      "controle de turmas",
      "capacidade",
      "vagas",
      "alunos por quadra",
      "lotacao",
      "professores",
      "classes",
      "nivel da turma",
    ],
    resposta: {
      texto:
        "No **Controle de Turmas** (`/classes`), a gestão equilibra a dinâmica pedagógica de cada treino:\n\n" +
        "• **Limite Máximo por Quadra:** Parametrização rígida de alunos por turma (ex.: 4 a 6 atletas) para garantir alto nível de instrução.\n" +
        "• **Nivelamento Homogêneo:** Separação das turmas por categorias técnicas para jogos equilibrados.\n" +
        "• **Vagas Disponíveis em Tempo Real:** Facilita encaixe de novos alunos matriculados e agendamento de reposições.\n" +
        "• **Atribuição de Instrutores:** Definição clara do professor responsável por cada horário da arena.",
      rotaSugerida: "/classes",
      labelRota: "Abrir Controle de Turmas",
      topicosRelacionados: [
        "Agenda de Quadras",
        "Controle de Presença",
        "Reposição de Aulas",
        "Alunos",
      ],
    },
  },

  // 10. CONTROLE DE PRESENÇA & CHAMADA
  {
    chaves: [
      "presenca",
      "chamada",
      "lista de presenca",
      "fazer chamada",
      "controle de presenca",
      "falta",
      "presenca de beira de quadra",
      "attendance",
    ],
    resposta: {
      texto:
        "O **Controle de Presença** (`/attendance`) foi planejado para operação rápida direto no celular ou tablet do professor na quadra:\n\n" +
        "• **Chamada em 1 Toque:** Registro instantâneo de Presença, Falta ou Falta Justificada.\n" +
        "• **Alimentação Automática do Streak:** A presença confirmada atualiza em tempo real a pontuação XP e o status ON FIRE do atleta.\n" +
        "• **Geração Automática de Direito a Reposição:** Faltas justificadas (por chuva ou atestado) geram crédito imediato no módulo de reposições.\n" +
        "• **Zero Papel na Quadra:** Elimina pranchetas de papel sujeitas a areia e perda de anotações.",
      rotaSugerida: "/attendance",
      labelRota: "Fazer Chamada de Presença",
      topicosRelacionados: [
        "Frequência",
        "Reposição de Aulas",
        "Card do Atleta",
        "Controle de Turmas",
      ],
    },
  },

  // 11. REPOSIÇÃO DE AULAS & SMART MATCHMAKER
  {
    chaves: [
      "reposicao",
      "reposicao de aulas",
      "aula de reposicao",
      "smart matchmaker",
      "casamento de reposicao",
      "chuva",
      "falta justificada",
      "pdf reposicoes",
      "class replacements",
    ],
    resposta: {
      texto:
        "O módulo de **Reposição de Aulas** (`/class-replacements`) é equipado com duas ferramentas de alta performance:\n\n" +
        "• **Smart Replacement Matchmaker:** Cruzamento automático do nível técnico do aluno faltante com vagas ociosas em turmas compatíveis da grade.\n" +
        "• **Miniligas Marco Roza (Torneio Express de Reposição):** Solução prática para repor aulas em formato de torneio dinâmico com rodadas de 5 min cronometradas.\n" +
        "• **Visão Agrupada por Aluno:** Acompanhamento claro de quantas aulas o atleta tem pendentes e quantas já foram repostas.\n" +
        "• **Exportação Estruturada em PDF:** Geração de relatórios com layout profissional e logo da Equipe Marco Roza.",
      rotaSugerida: "/class-replacements",
      labelRota: "Abrir Reposição de Aulas",
      topicosRelacionados: [
        "Miniligas Marco Roza",
        "Controle de Presença",
        "Controle de Turmas",
        "Athlete Card",
      ],
    },
  },

  // 11.1 MINILIGAS MARCO ROZA (TORNEIOS EXPRESS DE REPOSIÇÃO)
  {
    chaves: [
      "miniliga",
      "miniligas",
      "torneio express",
      "repor aula em grupo",
      "rodizio americano",
      "5 minutos",
      "cronometro miniliga",
      "intergrupos",
      "marco roza miniliga",
      "pontuacao miniliga",
      "5 participantes",
      "6 participantes",
      "8 participantes",
      "10 participantes",
      "12 participantes",
      "podio miniliga",
      "modo simulacao",
      "simular miniliga",
      "historico miniligas",
      "editar miniliga",
    ],
    resposta: {
      texto:
        "As **Miniligas Marco Roza** são o formato exclusivo da equipe para resolver reposições de forma dinâmica, divertida e ranqueada:\n\n" +
        "• **Modo Simulação (Sandbox) vs Modo Real:**\n" +
        "  - *🧪 Simulação:* Permite testar modalidades, auto-preencher placares aleatórios com 1 clique e validar a tabela sem mexer nos Cards dos alunos.\n" +
        "  - *🟢 Modo Real:* Para quando estiver valendo na quadra, creditando XP no Card do Atleta e dando baixa automática na falta de reposição.\n" +
        "• **Visão Panorâmica de Todos os Jogos (1 por 1):** Grade completa de partidas na tela, permitindo digitar os resultados jogo a jogo no ritmo do professor, recalculando a tabela ao vivo.\n" +
        "• **Modelos de Disputa & Equilíbrio Matemático Perfeito:**\n" +
        "  - **5 Alunos (1 Quadra):** 5 rodadas rotativas (4 jogos e 1 folga por atleta).\n" +
        "  - **6 Alunos (1 Quadra):** Modelo Oficial Marco Roza de 5 Jogos (8 rodadas no total, com 5 jogos para todos os alunos e sorteio de uma dupla de apoio para completar a 8ª rodada) ou Modelo Direto de 4 Jogos (6 rodadas, 4 jogos e 2 folgas iguais para todos).\n" +
        "  - **8 Alunos (2 Quadras):** Modo Intergrupos Oficial Marco Roza (Grupo 1 vs Grupo 2 com 12 rodadas no total divididas em 4 ciclos de 3 jogos: A1 com e1, f1, g1, h1 em confrontos 100% inéditos em 2 quadras) ou Rodízio Geral (7 rodadas perfeitas).\n" +
        "  - **10 Alunos (2 Quadras):** Modelo Oficial Marco Roza (Mini Liga Mista / Reposições) com 6 Rodadas Oficiais de 2 baterias cada + 2 Jogos Extras de Sorteio de Apoio totalizando 26 confrontos (14 entradas), onde cada um dos 10 alunos joga exatamente 10 partidas na fase classificatória, seguido de Semifinais (1ºA+1ªB vs 4ºA+4ªB e 2ºA+2ªB vs 3ºA+3ªB) e Grande Final.\n" +
        "  - **12 Alunos (3 Quadras):** Modelo Oficial Marco Roza com 11 rodadas completas (33 jogos) e 100% de ocupação simultânea (todos jogam 11 vezes, com cada aluno fazendo parceria com os outros 11 alunos exatamente uma vez, zero repetições de duplas ou confrontos).\n" +
        "• **Critérios Oficiais de Classificação Marco Roza (Todos os Formatos):**\n" +
        "  - 1º Critério: Número de Vitórias (V). Quando houver Semifinal e Final, soma-se 3 pontos nas vitórias (+3 vitórias por vitória em semi e final)!\n" +
        "  - 2º Critério: Saldo de Games (Saldo = Games Pró - Games Contra).\n" +
        "  - 3º Critério: Número de Games Vencidos (Games Pró / GP).\n" +
        "  - 4º Critério: Menor Número de Games Perdidos (Games Contra / GC).\n" +
        "  - *Total Geral da Tabela:* `Games Pró + Vitórias`.\n" +
        "• **Desempates & Finais Especiais:**\n" +
        "  - *Empate no 1º lugar:* Partida Extra de Simples (1º vs 2º) para decidir o título na bola!\n" +
        "  - *Tempo de sobra na aula:* Grande Final cruzada entre duplas (1º+3º vs 2º+4º).\n" +
        "• **Histórico & Edição:** Salva edições anteriores com opção de *Reabrir / Editar* e envio do pódio formatado direto para o WhatsApp dos alunos.",
      rotaSugerida: "/miniliga",
      labelRota: "Acessar Miniligas Marco Roza",
      topicosRelacionados: [
        "Reposição de Aulas",
        "Card do Atleta",
        "Controle de Presença",
        "Suporte Concierge",
      ],
    },
  },

  // 12. PLANO DE AULAS & PRANCHETA TÁTICA
  {
    chaves: [
      "plano de aulas",
      "prancheta tatica",
      "tatica",
      "treino",
      "drills",
      "smash",
      "gancho",
      "lob",
      "saque",
      "defesa baixa",
      "desenho de jogadas",
      "lesson plan",
    ],
    resposta: {
      texto:
        "O **Plano de Aulas** (`/lesson-plan`) eleva a qualidade metodológica com a **Prancheta Tática Digital**:\n\n" +
        "• **Prancheta Tática Interativa:** Desenho de jogadas, movimentações de duplas, trajetórias de bolas e posicionamento defensivo e ofensivo.\n" +
        "• **Biblioteca de Fundamentos do Beach Tennis:** Planejamento estruturado para treinos de Saque, Smash, Gancho, Lob e Bloqueio na rede.\n" +
        "• **Cronograma Pedagógico Semanal:** Garantia de que todas as turmas de um mesmo nível recebam o mesmo padrão de treino com os professores.\n" +
        "• **Exportação e Compartilhamento:** Permite demonstrar aos atletas a estratégia e os exercícios do dia.",
      rotaSugerida: "/lesson-plan",
      labelRota: "Abrir Plano de Aulas & Prancheta",
      topicosRelacionados: [
        "Provas",
        "Controle de Turmas",
        "Agenda de Quadras",
        "Card do Atleta",
      ],
    },
  },

  // 13. PROVAS & AVALIAÇÃO DE NÍVEL
  {
    chaves: [
      "provas",
      "avaliacao",
      "teste de nivel",
      "nivelamento",
      "subir de nivel",
      "graduacao",
      "criterios tecnicos",
      "tests",
    ],
    resposta: {
      texto:
        "O módulo de **Provas & Avaliações** (`/tests`) estabelece a régua técnica de graduação da **Equipe Marco Roza**:\n\n" +
        "• **Critérios de Nivelamento:** Avaliação de fundamentos práticos (controle de bola, direção de saque, potência de smash e leitura de jogo).\n" +
        "• **Histórico do Aluno:** Registro da evolução do atleta desde o dia da matrícula para acompanhar seu progresso esportivo.\n" +
        "• **Promoção de Categoria:** Segurança e critério transparente para promover alunos de Iniciante para Intermediário ou Avançado.\n" +
        "• **Certificação:** Emissão de resultado para valorizar a conquista do aluno.",
      rotaSugerida: "/tests",
      labelRota: "Abrir Provas & Avaliações",
      topicosRelacionados: [
        "Card do Atleta",
        "Plano de Aulas",
        "Alunos",
        "BI Comportamental",
      ],
    },
  },

  // 14. FINANCEIRO (RECEITAS, DESPESAS, FLUXO E PROJEÇÃO)
  {
    chaves: [
      "financeiro",
      "contas a pagar",
      "contas a receber",
      "fluxo de caixa",
      "projecao financeira",
      "despesas",
      "receitas",
      "custo das quadras",
      "iluminacao",
      "areia",
      "mensalidades",
      "inadimplencia",
    ],
    resposta: {
      texto:
        "A suite de **Gestão Financeira** da arena é 100% especializada no modelo de negócios do Beach Tennis:\n\n" +
        "• **Contas a Receber (`/finance/revenue`):** Acompanhamento de mensalidades, pagamentos avulsos e controle de adimplência.\n" +
        "• **Contas a Pagar (`/finance/expenses`):** Gestão de despesas de aluguel de quadras, energia/refletores, reposição de areia, tubos de bolas e remuneração da equipe.\n" +
        "• **Fluxo de Caixa (`/finance/cash-flow`):** Conciliação diária de entradas e saídas com saldo operacional consolidado.\n" +
        "• **Projeção Financeira (`/finance/projection`):** Estimativa preditiva de receita futura com base na taxa de renovação e recorrência.",
      rotaSugerida: "/finance/cash-flow",
      labelRota: "Abrir Fluxo de Caixa",
      topicosRelacionados: [
        "BI Financeiro",
        "Simulador What-If",
        "Planos e Mensalidades",
        "Modo Discreto",
      ],
    },
  },

  // 15. SIMULADOR WHAT-IF FINANCEIRO
  {
    chaves: [
      "simulador",
      "what-if",
      "what if",
      "simulador financeiro",
      "cenarios",
      "reajuste de mensalidade",
      "abrir nova quadra",
      "contratar professor",
      "projecao de cenarios",
    ],
    resposta: {
      texto:
        "O **Simulador What-If Financeiro** é a ferramenta de tomada de decisão estratégica dos gestores da **Equipe Marco Roza**:\n\n" +
        "• **Simulação de Reajuste:** Calcule o impacto exato no faturamento anual ao aplicar um reajuste percentual nas mensalidades.\n" +
        "• **Expansão de Quadras:** Projeção de ROI e prazo de retorno ao abrir uma nova quadra na arena.\n" +
        "• **Contratação de Novos Instrutores:** Simulação da viabilidade financeira de abrir novas turmas e turnos.\n" +
        "• **Sensibilidade de Churn:** Visualize quantos alunos a arena pode reter para manter o equilíbrio orçamentário positivo.",
      rotaSugerida: "/finance/projection",
      labelRota: "Abrir Projeção & Simulador",
      topicosRelacionados: [
        "BI Financeiro",
        "Planos e Mensalidades",
        "Fluxo de Caixa",
        "BI Comportamental",
      ],
    },
  },

  // 16. MODO DISCRETO / PRIVACIDADE NA ARENA (LGPD)
  {
    chaves: [
      "modo discreto",
      "privacidade",
      "esconder valores",
      "lgpd",
      "olhares curiosos",
      "recepcao",
      "seguranca visual",
      "ocultar faturamento",
    ],
    resposta: {
      texto:
        "O **Modo Discreto** (`DiscreetModeToggle`) é a proteção de privacidade visual pioneira implementada na arena:\n\n" +
        "• **Ocultação de Cifras Sensíveis:** Com apenas 1 clique no menu lateral, todos os valores em R$ de faturamento, saldos e despesas são mascarados com blur suave.\n" +
        "• **Segurança na Recepção:** Permite que coordenadores e atendentes utilizem o sistema à vista de alunos e clientes sem expor as finanças da empresa.\n" +
        "• **Termômetros de Vidro Preservados:** Os gráficos e indicadores visuais continuam funcionando sem revelar números confidenciais.",
      topicosRelacionados: [
        "BI Financeiro",
        "Fluxo de Caixa",
        "Arena Live",
        "Alunos",
      ],
    },
  },

  // 17. PLANOS & MENSALIDADES
  {
    chaves: [
      "planos",
      "mensalidades",
      "tabela de precos",
      "plano 1x",
      "plano 2x",
      "plano 3x",
      "day use",
      "avulso",
      "planos manage",
    ],
    resposta: {
      texto:
        "No gerenciamento de **Planos** (`/plans/manage`), a arena configura seus pacotes comerciais:\n\n" +
        "• **Planos Semanais:** 1x, 2x ou 3x treinos por semana com valores ajustados.\n" +
        "• **Pacotes Especiais:** Day Use, Aulas Avulsas, Treino Vip Personalizado e Locação Avulsa de Quadras.\n" +
        "• **Regras de Reposição por Plano:** Definição de prazo de validade e limite de reposições mensais conforme a categoria do contrato.",
      rotaSugerida: "/plans/manage",
      labelRota: "Gerenciar Planos",
      topicosRelacionados: [
        "Alunos",
        "Contas a Receber",
        "BI Financeiro",
        "Simulador What-If",
      ],
    },
  },

  // 18. FREQUÊNCIA & ASSIDUIDADE
  {
    chaves: [
      "frequencia",
      "relatorio de frequencia",
      "assiduidade",
      "percentual de presenca",
      "taxa de presenca",
      "frequency",
    ],
    resposta: {
      texto:
        "O **Relatório de Frequência** (`/frequency`) analisa detalhadamente o engajamento dos alunos:\n\n" +
        "• **Assiduidade Percentual:** Cálculo exato de presenças x faltas por período letivo.\n" +
        "• **Histórico por Aluno e Turma:** Identificação rápida de turmas com alta aderência e turmas com oscilações.\n" +
        "• **Exportação de Dados:** Dados consolidados para alinhamento com os professores e incentivo de premiações de fidelidade.",
      rotaSugerida: "/frequency",
      labelRota: "Abrir Relatório de Frequência",
      topicosRelacionados: [
        "Controle de Presença",
        "Radar de Churn",
        "Card do Atleta",
        "BI Comportamental",
      ],
    },
  },
];

const RESPOSTA_PADRAO: RespostaCopiloto = {
  texto:
    "Compreendo perfeitamente sua dúvida! O sistema da **Equipe Marco Roza Beach Tennis** é a plataforma completa de inteligência e gestão de arenas esportivas, integrando painel de quadras para TV, controle de turmas, chamada digital, BI Financeiro com termômetros de vidro, Card do Atleta gamificado e reposições inteligentes.\n\n" +
    "Se preferir atendimento em tempo real ou quiser enviar um **print/áudio da arena**, você pode acionar nosso canal de **Suporte Concierge 24/7 no Telegram** (`@diroza_concierge_bot`) ou escolher um dos tópicos abaixo:",
  topicosRelacionados: [
    "Suporte Concierge Telegram 24/7",
    "Modo TV / Arena Live",
    "BI Financeiro & Vidro",
    "Card do Atleta & Streak",
    "Smart Matchmaker Reposição",
    "Agendar com Anderson Diroza",
  ],
  linkExterno: {
    label: "Transferir para o Suporte Concierge Telegram 24/7",
    url: TELEGRAM_CONCIERGE_URL,
  },
};

export function buscarRespostaCopiloto(termo: string): RespostaCopiloto {
  const q = termo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!q) return RESPOSTA_PADRAO;

  let melhorScore = 0;
  let melhorResposta: RespostaCopiloto | null = null;

  for (const item of BASE_CONHECIMENTO) {
    let score = 0;
    for (const chave of item.chaves) {
      const c = chave
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      if (q === c) {
        score += 15;
      } else if (q.includes(c)) {
        score += 8 + c.length;
      } else if (c.includes(q) && q.length >= 4) {
        score += 5;
      } else {
        // Checagem de palavras soltas
        const palavrasChave = c.split(" ");
        for (const palavra of palavrasChave) {
          if (palavra.length >= 4 && q.includes(palavra)) {
            score += 3;
          }
        }
      }
    }

    if (score > melhorScore) {
      melhorScore = score;
      melhorResposta = item.resposta;
    }
  }

  if (melhorScore >= 4 && melhorResposta) {
    return melhorResposta;
  }

  return RESPOSTA_PADRAO;
}
