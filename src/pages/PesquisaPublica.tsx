import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Database, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmbeddedAdvancedSearch } from "@/components/EmbeddedAdvancedSearch";

export default function PesquisaPublica() {
  return (
    <>
      <Helmet>
        <title>Pesquisa de Transações ITBI | Godoy Prime Realty</title>
        <meta name="description" content="Pesquise transações imobiliárias reais do ITBI no Rio de Janeiro. Dados oficiais da Prefeitura com filtros avançados." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Voltar</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <span className="font-semibold">Godoy Prime</span>
            </div>

            <Link to="/avaliacao">
              <Button size="sm" variant="default">
                Avaliar Imóvel
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                <Database className="h-4 w-4" />
                <span>33.520+ Transações Oficiais</span>
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                Pesquisa de Transações <span className="text-primary">ITBI</span>
              </h1>
              
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Acesse dados reais de compra e venda de imóveis no Rio de Janeiro. 
                Fonte oficial: Prefeitura do Rio de Janeiro (2020-2025).
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4 text-primary" />
                  <span>Busca por endereço</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Preços reais por m²</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
              <EmbeddedAdvancedSearch defaultBairro="" />
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-8 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Sobre os Dados</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p><strong className="text-foreground">Fonte:</strong> Prefeitura do Rio de Janeiro - ITBI</p>
                  <p><strong className="text-foreground">Período:</strong> Janeiro/2020 a Novembro/2025</p>
                  <p><strong className="text-foreground">Cobertura:</strong> Todos os bairros do Rio de Janeiro</p>
                </div>
                <div className="space-y-2">
                  <p><strong className="text-foreground">Filtros aplicados:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Apenas transações residenciais</li>
                    <li>Percentual transferido ≥ 90%</li>
                    <li>Outliers removidos automaticamente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          <div className="container mx-auto px-4">
            <p>© {new Date().getFullYear()} Godoy Prime Realty. Dados oficiais ITBI.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
