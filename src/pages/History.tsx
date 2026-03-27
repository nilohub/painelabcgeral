import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { History as HistoryIcon, Trash2, FileSpreadsheet, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UploadRecord {
  id: string;
  file_name: string;
  year: number;
  month: number;
  store: string;
  subgroup: string;
  records_count: number;
  created_at: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const History = () => {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("upload_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching uploads:", error);
    } else {
      setUploads(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (upload: UploadRecord) => {
    setDeleting(upload.id);
    try {
      // Delete sales data for this upload
      const { error: salesError } = await supabase
        .from("sales_data")
        .delete()
        .eq("year", upload.year)
        .eq("month", upload.month)
        .eq("store", upload.store)
        .eq("subgroup", upload.subgroup);

      if (salesError) throw salesError;

      // Delete upload history record
      const { error: historyError } = await supabase
        .from("upload_history")
        .delete()
        .eq("id", upload.id);

      if (historyError) throw historyError;

      toast({
        title: "Registro excluído",
        description: `${upload.records_count} registros foram removidos`,
      });

      fetchUploads();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o registro",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const { error: salesError } = await supabase
        .from("sales_data")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (salesError) throw salesError;

      const { error: historyError } = await supabase
        .from("upload_history")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (historyError) throw historyError;

      toast({
        title: "Todos os dados excluídos",
        description: "Todos os registros foram removidos com sucesso",
      });

      fetchUploads();
    } catch (error) {
      console.error("Delete all error:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir todos os registros",
        variant: "destructive",
      });
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico de Uploads</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os arquivos importados
            </p>
          </div>

          {uploads.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deletingAll}
                  className="gap-2"
                >
                  {deletingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Excluir Tudo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir todos os dados?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover TODOS os registros de vendas e histórico de uploads.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
              Uploads Realizados
            </CardTitle>
            <CardDescription>
              Total de {uploads.length} arquivos importados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : uploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Nenhum arquivo importado ainda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                        <FileSpreadsheet className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{upload.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {upload.year} • {MONTHS[upload.month - 1]} • Loja {upload.store} • {upload.subgroup}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {upload.records_count} registros • {format(new Date(upload.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={deleting === upload.id}
                        >
                          {deleting === upload.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá remover {upload.records_count} registros de vendas
                            relacionados a este arquivo. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(upload)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default History;
