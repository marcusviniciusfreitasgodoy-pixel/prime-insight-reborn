import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { Loader2, FileText, MessageSquare, Download, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pdf_download: { label: "Download PDF", icon: <Download className="h-4 w-4" />, color: "bg-blue-500" },
  parecer_solicitado: { label: "Parecer Solicitado", icon: <FileText className="h-4 w-4" />, color: "bg-green-500" },
  whatsapp_click: { label: "WhatsApp Click", icon: <MessageSquare className="h-4 w-4" />, color: "bg-emerald-500" },
  lead_capture: { label: "Lead Capturado", icon: <TrendingUp className="h-4 w-4" />, color: "bg-purple-500" },
  quick_valuation: { label: "Avaliação Rápida", icon: <Calendar className="h-4 w-4" />, color: "bg-amber-500" },
};

export default function AdminAnalytics() {
  const { data, isLoading, error } = useAnalyticsEvents(30);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Erro ao carregar analytics. Verifique se você tem permissão de admin.
      </div>
    );
  }

  const { daily, kpis } = data || { daily: [], kpis: [] };

  // Agrupar daily por bairro
  const byBairro: Record<string, typeof daily> = {};
  for (const row of daily) {
    if (!byBairro[row.bairro]) byBairro[row.bairro] = [];
    byBairro[row.bairro].push(row);
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const config = EVENT_LABELS[kpi.event_type] || { label: kpi.event_type, icon: null, color: "bg-gray-500" };
          return (
            <Card key={kpi.event_type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {config.icon}
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.total}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Hoje: <span className="font-medium text-foreground">{kpi.today}</span> | 
                  7 dias: <span className="font-medium text-foreground">{kpi.last7days}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabela por dia */}
      <Tabs defaultValue="por-dia" className="w-full">
        <TabsList>
          <TabsTrigger value="por-dia">Por Dia</TabsTrigger>
          <TabsTrigger value="por-bairro">Por Bairro</TabsTrigger>
        </TabsList>

        <TabsContent value="por-dia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eventos por Dia (últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {daily.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum evento registrado ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daily.slice(0, 100).map((row, i) => {
                      const config = EVENT_LABELS[row.event_type] || { label: row.event_type, color: "bg-gray-500" };
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {format(new Date(row.dia), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${config.color} text-white`}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.bairro}</TableCell>
                          <TableCell className="text-right font-bold">{row.total}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="por-bairro">
          <div className="grid gap-4">
            {Object.entries(byBairro)
              .sort((a, b) => b[1].reduce((s, r) => s + r.total, 0) - a[1].reduce((s, r) => s + r.total, 0))
              .slice(0, 20)
              .map(([bairro, rows]) => {
                const total = rows.reduce((s, r) => s + r.total, 0);
                return (
                  <Card key={bairro}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex justify-between">
                        <span>{bairro}</span>
                        <Badge variant="outline">{total} eventos</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          rows.reduce((acc, r) => {
                            acc[r.event_type] = (acc[r.event_type] || 0) + r.total;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => {
                          const config = EVENT_LABELS[type] || { label: type, color: "bg-gray-500" };
                          return (
                            <Badge key={type} className={`${config.color} text-white`}>
                              {config.label}: {count}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
