import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquareHeart,
  Star,
  Search,
  ArrowLeft,
  TrendingUp,
  MessageCircle,
  ThumbsUp,
  Bug,
  ClipboardCheck,
  Eye,
  BarChart3,
  Users,
  Target,
  Sparkles,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { surveyQuestions } from "@/components/feedback/surveyQuestions";
import { Json } from "@/integrations/supabase/types";

const tipoLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sugestao: { label: "Sugestão", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <TrendingUp className="w-4 h-4" /> },
  bug: { label: "Bug", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <Bug className="w-4 h-4" /> },
  elogio: { label: "Elogio", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <ThumbsUp className="w-4 h-4" /> },
  critica: { label: "Crítica", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: <AlertCircle className="w-4 h-4" /> },
  outro: { label: "Outro", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: <MessageCircle className="w-4 h-4" /> },
  pesquisa_validacao: { label: "Pesquisa de Validação", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: <ClipboardCheck className="w-4 h-4" /> },
};

// Score mapping for each response (positive = 3, neutral = 2, negative = 1)
const responseScores: Record<string, number> = {
  // Positive responses (3 points)
  sim_totalmente: 3, com_certeza: 3, muito_facil: 3, otima: 3, muito_claras: 3,
  profissional: 3, muito_util: 3, sim: 3, nunca_vi: 3,
  // Neutral responses (2 points)
  parcialmente: 2, talvez: 2, facil: 2, boa: 2, claras: 2, bom: 2, util: 2,
  provavelmente: 2, vi_similar: 2, nao_testei: 2, nao_usei: 2,
  // Negative responses (1 point)
  nao_muito: 1, indiferente: 1, algumas_dificuldades: 1, regular: 1,
  confusas_em_partes: 1, simples: 1, precisa_melhorar: 1, nao: 1, conheco_bem: 1,
};

const answerLabels: Record<string, string> = {
  sim_totalmente: "✅ Sim, totalmente!",
  parcialmente: "🤔 Parcialmente",
  nao_muito: "😕 Não muito",
  nunca_vi: "🆕 Nunca vi nada assim",
  vi_similar: "👀 Vi algo similar",
  conheco_bem: "🎯 Já conheço bem esse tipo",
  com_certeza: "💪 Com certeza!",
  talvez: "🤷 Talvez",
  indiferente: "😐 Indiferente",
  muito_facil: "🚀 Muito fácil",
  facil: "👍 Fácil",
  algumas_dificuldades: "😕 Algumas dificuldades",
  otima: "📱 Ótima",
  boa: "👍 Boa",
  regular: "😐 Regular",
  nao_testei: "🤷 Não testei no celular",
  muito_claras: "💡 Muito claras",
  claras: "✅ Claras",
  confusas_em_partes: "🤔 Confusas em partes",
  profissional: "⭐ Profissional e elegante",
  bom: "👍 Bom",
  simples: "😐 Simples",
  precisa_melhorar: "🔧 Precisa melhorar",
  muito_util: "🤖 Muito útil!",
  util: "👍 Útil",
  nao_usei: "❌ Não usei",
  provavelmente: "👍 Provavelmente",
  sim: "✅ Sim!",
  nao: "❌ Não",
};

interface Feedback {
  id: string;
  nome: string | null;
  email: string | null;
  tipo_feedback: string;
  avaliacao: number | null;
  mensagem: string;
  pagina_origem: string | null;
  created_at: string;
  respostas_questionario: Json | null;
}

const calculateSurveyScore = (respostas: Record<string, string> | null): number => {
  if (!respostas || Object.keys(respostas).length === 0) return 0;
  const scores = Object.values(respostas).map(answer => responseScores[answer] || 2);
  const total = scores.reduce((acc, score) => acc + score, 0);
  const max = scores.length * 3;
  return Math.round((total / max) * 100);
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const getScoreIcon = (score: number) => {
  if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  return <XCircle className="w-5 h-5 text-red-500" />;
};

const AdminFeedbacks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [avaliacaoFilter, setAvaliacaoFilter] = useState<string>("todas");

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    },
  });

  const filteredFeedbacks = feedbacks?.filter((f) => {
    const matchesSearch =
      !searchTerm ||
      f.mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = tipoFilter === "todos" || f.tipo_feedback === tipoFilter;
    const matchesAvaliacao =
      avaliacaoFilter === "todas" || f.avaliacao?.toString() === avaliacaoFilter;

    return matchesSearch && matchesTipo && matchesAvaliacao;
  });

  // Validation survey feedbacks
  const validationSurveys = feedbacks?.filter(f => 
    f.tipo_feedback === "pesquisa_validacao" && f.respostas_questionario
  ) || [];

  // Calculate aggregate statistics for survey questions
  const surveyStats = surveyQuestions.map(question => {
    const responses: Record<string, number> = {};
    question.options.forEach(opt => { responses[opt.value] = 0; });
    
    validationSurveys.forEach(survey => {
      const respostas = survey.respostas_questionario as Record<string, string> | null;
      if (respostas && respostas[question.id]) {
        const answer = respostas[question.id];
        if (responses[answer] !== undefined) {
          responses[answer]++;
        }
      }
    });
    
    const total = Object.values(responses).reduce((a, b) => a + b, 0);
    
    return {
      ...question,
      responses,
      total,
    };
  });

  // General statistics
  const stats = feedbacks
    ? {
        total: feedbacks.length,
        mediaAvaliacao:
          feedbacks.filter((f) => f.avaliacao).reduce((acc, f) => acc + (f.avaliacao || 0), 0) /
            feedbacks.filter((f) => f.avaliacao).length || 0,
        porTipo: {
          sugestao: feedbacks.filter((f) => f.tipo_feedback === "sugestao").length,
          bug: feedbacks.filter((f) => f.tipo_feedback === "bug").length,
          elogio: feedbacks.filter((f) => f.tipo_feedback === "elogio").length,
          critica: feedbacks.filter((f) => f.tipo_feedback === "critica").length,
          outro: feedbacks.filter((f) => f.tipo_feedback === "outro").length,
          pesquisa_validacao: feedbacks.filter((f) => f.tipo_feedback === "pesquisa_validacao").length,
        },
        totalPesquisas: validationSurveys.length,
        mediaPontuacao: validationSurveys.length > 0 
          ? Math.round(validationSurveys.reduce((acc, s) => 
              acc + calculateSurveyScore(s.respostas_questionario as Record<string, string>), 0
            ) / validationSurveys.length)
          : 0,
      }
    : null;

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">-</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  const SurveyResponsesDialog = ({ feedback }: { feedback: Feedback }) => {
    const respostas = feedback.respostas_questionario as Record<string, string> | null;
    if (!respostas) return null;
    
    const score = calculateSurveyScore(respostas);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            Ver respostas
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Respostas da Pesquisa
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Score Header */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Pontuação Geral</p>
                <div className="flex items-center gap-2 mt-1">
                  {getScoreIcon(score)}
                  <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Respondente</p>
                <p className="font-medium">{feedback.nome || "Anônimo"}</p>
                {feedback.email && <p className="text-sm text-muted-foreground">{feedback.email}</p>}
              </div>
            </div>
            
            {/* Responses */}
            <div className="space-y-4">
              {surveyQuestions.map((q, index) => {
                const answer = respostas[q.id];
                const scoreValue = responseScores[answer];
                
                return (
                  <div key={q.id} className="border-b border-border pb-3 last:border-0">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {index + 1}. {q.question}
                    </p>
                    {answer ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{answerLabels[answer] || answer}</span>
                        <Badge variant={scoreValue === 3 ? "default" : scoreValue === 2 ? "secondary" : "destructive"}>
                          {scoreValue === 3 ? "Positivo" : scoreValue === 2 ? "Neutro" : "Negativo"}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Não respondido</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Additional comments */}
            {feedback.mensagem && feedback.mensagem !== "Apenas respondeu o questionário" && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Comentários adicionais:</p>
                <p className="text-sm text-muted-foreground">{feedback.mensagem}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/leads">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquareHeart className="w-6 h-6 text-primary" />
                Dashboard de Feedbacks
              </h1>
              <p className="text-muted-foreground">Análise completa das respostas e pesquisas de validação</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="pesquisas" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Pesquisas
            </TabsTrigger>
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Todos
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Main KPIs */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-purple-500" />
                      Pesquisas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalPesquisas}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">respondentes</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Pontuação Média
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getScoreColor(stats.mediaPontuacao)}`}>
                      {stats.mediaPontuacao}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">satisfação geral</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Média Estrelas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.mediaAvaliacao.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">de 5 estrelas</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Total Feedbacks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.total}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">recebidos</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Survey Questions Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Análise por Pergunta
                </CardTitle>
                <CardDescription>
                  Distribuição das respostas em cada pergunta da pesquisa de validação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {surveyStats.map((stat, index) => (
                  <div key={stat.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">
                        {index + 1}. {stat.question}
                      </p>
                      <Badge variant="outline">{stat.total} respostas</Badge>
                    </div>
                    <div className="space-y-1">
                      {stat.options.map(option => {
                        const count = stat.responses[option.value] || 0;
                        const percentage = stat.total > 0 ? (count / stat.total) * 100 : 0;
                        const scoreType = responseScores[option.value];
                        
                        return (
                          <div key={option.value} className="flex items-center gap-2">
                            <div className="w-32 text-xs truncate" title={option.label}>
                              {option.emoji} {option.label}
                            </div>
                            <Progress 
                              value={percentage} 
                              className={`flex-1 h-2 ${
                                scoreType === 3 ? "[&>div]:bg-green-500" :
                                scoreType === 2 ? "[&>div]:bg-yellow-500" :
                                "[&>div]:bg-red-500"
                              }`}
                            />
                            <div className="w-16 text-xs text-right text-muted-foreground">
                              {count} ({percentage.toFixed(0)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {validationSurveys.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma pesquisa de validação recebida ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pesquisas Tab */}
          <TabsContent value="pesquisas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pesquisas de Validação</CardTitle>
                <CardDescription>
                  {validationSurveys.length} pesquisas recebidas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {validationSurveys.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhuma pesquisa de validação recebida ainda
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Pontuação</TableHead>
                        <TableHead>Estrelas</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationSurveys.map((feedback) => {
                        const score = calculateSurveyScore(feedback.respostas_questionario as Record<string, string>);
                        return (
                          <TableRow key={feedback.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(feedback.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getScoreIcon(score)}
                                <span className={`font-bold ${getScoreColor(score)}`}>{score}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{renderStars(feedback.avaliacao)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {feedback.nome && <div className="font-medium">{feedback.nome}</div>}
                                {feedback.email && (
                                  <div className="text-muted-foreground">{feedback.email}</div>
                                )}
                                {!feedback.nome && !feedback.email && (
                                  <span className="text-muted-foreground">Anônimo</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <SurveyResponsesDialog feedback={feedback} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Todos Tab */}
          <TabsContent value="todos" className="space-y-4">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      {stats.total}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pesquisas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-purple-500" />
                      {stats.porTipo.pesquisa_validacao}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sugestões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      {stats.porTipo.sugestao}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Elogios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-green-500" />
                      {stats.porTipo.elogio}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      {stats.porTipo.critica}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bugs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Bug className="w-5 h-5 text-red-500" />
                      {stats.porTipo.bug}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por mensagem, nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="pesquisa_validacao">Pesquisa de Validação</SelectItem>
                  <SelectItem value="sugestao">Sugestão</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="elogio">Elogio</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={avaliacaoFilter} onValueChange={setAvaliacaoFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas avaliações</SelectItem>
                  <SelectItem value="5">5 estrelas</SelectItem>
                  <SelectItem value="4">4 estrelas</SelectItem>
                  <SelectItem value="3">3 estrelas</SelectItem>
                  <SelectItem value="2">2 estrelas</SelectItem>
                  <SelectItem value="1">1 estrela</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Carregando feedbacks...</div>
                ) : filteredFeedbacks?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhum feedback encontrado</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead className="max-w-md">Mensagem</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeedbacks?.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(feedback.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={tipoLabels[feedback.tipo_feedback]?.color}
                            >
                              {tipoLabels[feedback.tipo_feedback]?.label || feedback.tipo_feedback}
                            </Badge>
                          </TableCell>
                          <TableCell>{renderStars(feedback.avaliacao)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {feedback.nome && <div className="font-medium">{feedback.nome}</div>}
                              {feedback.email && (
                                <div className="text-muted-foreground">{feedback.email}</div>
                              )}
                              {!feedback.nome && !feedback.email && (
                                <span className="text-muted-foreground">Anônimo</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="truncate" title={feedback.mensagem}>
                              {feedback.mensagem}
                            </p>
                          </TableCell>
                          <TableCell>
                            {feedback.tipo_feedback === "pesquisa_validacao" && feedback.respostas_questionario && (
                              <SurveyResponsesDialog feedback={feedback} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFeedbacks;
