export interface QA {
  question: string;
  answer: string;
}

/**
 * Fonte única das perguntas frequentes. Consumida na landing (`LandingFaq`)
 * e no menu de Ajuda do painel (`HelpFab`) — mantém o conteúdo sincronizado.
 */
export const faqs: QA[] = [
  {
    question: "O que é o Felice?",
    answer:
      "É uma plataforma completa para organizar o casamento em um só lugar: lista de convidados, confirmação de presença (RSVP) por link, controle de orçamento, disposição das mesas, site dos noivos e lista de presentes que cai direto no seu PIX.",
  },
  {
    question: "Posso testar de graça?",
    answer:
      "Sim. O plano Free é gratuito para sempre e permite organizar 1 casamento com lista de convidados, RSVP por link e controle básico de orçamento — sem precisar de cartão de crédito.",
  },
  {
    question: "Como funciona a lista de presentes?",
    answer:
      "Você cria sua lista de presentes e cada convidado contribui via PIX. O valor cai diretamente na sua conta, sem intermediários e sem taxas escondidas. Acompanhe tudo em tempo real pelo painel.",
  },
  {
    question: "A IA Lia está em quais planos?",
    answer:
      "A Lia, sua assistente de IA, está disponível nos planos Pro (acesso básico) e Gestor (acesso ilimitado). Ela ajuda a tirar dúvidas, gerar textos de convite e sugerir formas de organizar o evento.",
  },
  {
    question: "Meus dados e os dos convidados estão seguros?",
    answer:
      "Sim. As senhas são guardadas com hashing forte (argon2id) e todo o tráfego trafega por HTTPS/TLS. Cada casamento fica isolado em seu próprio espaço de trabalho (multi-tenant): ninguém enxerga os dados de outro. Os convidados acessam apenas por um link tokenizado, restrito ao próprio convidado.",
  },
  {
    question: "Como recebo os presentes via PIX?",
    answer:
      "Você cadastra sua chave PIX e os convidados contribuem direto para ela. O valor cai na sua conta sem intermediários e sem taxas escondidas — não retemos o dinheiro. Cada contribuição fica registrada no painel para você acompanhar quem já presenteou.",
  },
  {
    question: "Qual a diferença entre gerenciar 1 casamento e vários?",
    answer:
      "Os planos Free e Pro são pensados para um casamento: ideais para os próprios noivos. Já o plano Gestor permite até 5 casamentos ativos ao mesmo tempo, com dashboard analítico por evento e equipe ilimitada — feito para assessorias que organizam vários casamentos em paralelo.",
  },
  {
    question: "Quais são as formas de pagamento dos planos?",
    answer:
      "As assinaturas dos planos Pro e Gestor são processadas com segurança pela Stripe, com cobrança recorrente mensal no cartão de crédito. Você pode cancelar quando quiser pelo painel de configurações, e o acesso pago permanece até o fim do ciclo já pago.",
  },
];
