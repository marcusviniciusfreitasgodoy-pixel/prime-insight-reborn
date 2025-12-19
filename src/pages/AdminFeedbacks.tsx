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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { Link } from "react-router-dom";

const tipoLabels: Record<string, { label: string; color: string }> = {
  sugestao: { label: "Sugestão", color: "bg-blue-100 text-blue-800" },
  bug: { label: "Bug", color: "bg-red-100 text-red-800" },
  elogio: { label: "Elogio", color: "bg-green-100 text-green-800" },
  critica: { label: "Crítica", color: "bg-orange-100 text-orange-800" },
  outro: { label: "Outro", color: "bg-gray-100 text-gray-800" },
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
}

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

  // Statistics
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
        },
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
                Feedbacks
              </h1>
              <p className="text-muted-foreground">Gerencie os feedbacks recebidos</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Média Avaliação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  {stats.mediaAvaliacao.toFixed(1)}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminFeedbacks;
