import { QuestionOption } from "./QuestionCard";

export interface SurveyQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
}

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: "faz_sentido",
    question: "Este tipo de serviço faz sentido para você?",
    options: [
      { value: "sim_totalmente", label: "Sim, totalmente!", emoji: "✅" },
      { value: "parcialmente", label: "Parcialmente", emoji: "🤔" },
      { value: "nao_muito", label: "Não muito", emoji: "😕" },
    ],
  },
  {
    id: "ja_viu_similar",
    question: "Você já viu algo parecido antes?",
    options: [
      { value: "nunca_vi", label: "Nunca vi nada assim", emoji: "🆕" },
      { value: "vi_similar", label: "Vi algo similar", emoji: "👀" },
      { value: "conheco_bem", label: "Já conheço bem esse tipo", emoji: "🎯" },
    ],
  },
  {
    id: "ajuda_decisao",
    question: "Isso ajudaria você em uma decisão sobre imóveis?",
    options: [
      { value: "com_certeza", label: "Com certeza!", emoji: "💪" },
      { value: "talvez", label: "Talvez", emoji: "🤷" },
      { value: "indiferente", label: "Indiferente", emoji: "😐" },
    ],
  },
  {
    id: "navegacao",
    question: "Como foi navegar pela plataforma?",
    options: [
      { value: "muito_facil", label: "Muito fácil", emoji: "🚀" },
      { value: "facil", label: "Fácil", emoji: "👍" },
      { value: "algumas_dificuldades", label: "Algumas dificuldades", emoji: "😕" },
    ],
  },
  {
    id: "mobile",
    question: "A visualização no celular está adequada?",
    options: [
      { value: "otima", label: "Ótima", emoji: "📱" },
      { value: "boa", label: "Boa", emoji: "👍" },
      { value: "regular", label: "Regular", emoji: "😐" },
      { value: "nao_testei", label: "Não testei no celular", emoji: "🤷" },
    ],
  },
  {
    id: "clareza",
    question: "As informações são claras?",
    options: [
      { value: "muito_claras", label: "Muito claras", emoji: "💡" },
      { value: "claras", label: "Claras", emoji: "✅" },
      { value: "confusas_em_partes", label: "Confusas em partes", emoji: "🤔" },
    ],
  },
  {
    id: "visual",
    question: "O que achou do visual da plataforma?",
    options: [
      { value: "profissional", label: "Profissional e elegante", emoji: "⭐" },
      { value: "bom", label: "Bom", emoji: "👍" },
      { value: "simples", label: "Simples", emoji: "😐" },
      { value: "precisa_melhorar", label: "Precisa melhorar", emoji: "🔧" },
    ],
  },
  {
    id: "sofia_ia",
    question: "A Sofia (assistente IA) foi útil?",
    options: [
      { value: "muito_util", label: "Muito útil!", emoji: "🤖" },
      { value: "util", label: "Útil", emoji: "👍" },
      { value: "indiferente", label: "Indiferente", emoji: "😐" },
      { value: "nao_usei", label: "Não usei", emoji: "❌" },
    ],
  },
  {
    id: "compartilharia",
    question: "Você compartilharia com alguém?",
    options: [
      { value: "com_certeza", label: "Com certeza!", emoji: "🚀" },
      { value: "provavelmente", label: "Provavelmente", emoji: "👍" },
      { value: "talvez", label: "Talvez", emoji: "🤔" },
      { value: "nao", label: "Não", emoji: "❌" },
    ],
  },
  {
    id: "usaria_novamente",
    question: "Usaria novamente?",
    options: [
      { value: "sim", label: "Sim!", emoji: "✅" },
      { value: "talvez", label: "Talvez", emoji: "🤔" },
      { value: "nao", label: "Não", emoji: "❌" },
    ],
  },
];
