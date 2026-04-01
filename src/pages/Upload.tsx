import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload as UploadIcon, FileSpreadsheet, X, Check, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface PendingFile {
  file: File;
  year: string;
  month: string;
  store: string;
  subgroup: string;
}

const STORES = ["01", "02", "05", "07", "08", "09", "10"];
const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

const Upload = () => {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState({
    year: currentYear.toString(),
    month: "1",
    store: "01",
    subgroup: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (!currentConfig.subgroup.trim()) {
      toast({
        title: "Subgrupo obrigatório",
        description: "Digite o subgrupo antes de adicionar o arquivo",
        variant: "destructive",
      });
      return;
    }

    const newFiles: PendingFile[] = Array.from(files).map((file) => ({
      file,
      year: currentConfig.year,
      month: currentConfig.month,
      store: currentConfig.store,
      subgroup: currentConfig.subgroup.trim(),
    }));

    setPendingFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    const str = value.toString().trim();
    const cleaned = str.replace(/[^\d,.\-]/g, "");
    if (!cleaned) return 0;
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    let normalized: string;
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const processUpload = async () => {
    if (pendingFiles.length === 0) {
      toast({
        title: "Nenhum arquivo",
        description: "Adicione pelo menos um arquivo para fazer upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let totalRecords = 0;

    try {
      for (const pendingFile of pendingFiles) {
        const rows = await parseExcelFile(pendingFile.file);
        const records: any[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (!row || row.length < 11) continue;

          const productCode = row[0]?.toString().trim();
          const productDescription = row[1]?.toString().trim();
          if (!productCode || !productDescription) continue;

          records.push({
            year: parseInt(pendingFile.year),
            month: parseInt(pendingFile.month),
            store: pendingFile.store,
            subgroup: pendingFile.subgroup,
            product_code: productCode,
            product_description: productDescription,
            quantity: parseNumber(row[2]),
            sales_value: parseNumber(row[3]),
            profit: parseNumber(row[7]),
            quantity_percentage: parseNumber(row[8]),
            sales_percentage: parseNumber(row[9]),
            profit_percentage: parseNumber(row[10]),
          });
        }

        if (records.length > 0) {
          const { error } = await supabase.from("sales_data").insert(records);
          if (error) throw error;

          await supabase.from("upload_history").insert({
            file_name: pendingFile.file.name,
            year: parseInt(pendingFile.year),
            month: parseInt(pendingFile.month),
            store: pendingFile.store,
            subgroup: pendingFile.subgroup,
            records_count: records.length,
          });

          totalRecords += records.length;
        }
      }

      toast({
        title: "Upload concluído!",
        description: `${totalRecords} registros importados com sucesso`,
      });
      setPendingFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao processar os arquivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getMonthLabel = (month: string) => {
    return MONTHS.find((m) => m.value === month)?.label || month;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload de Arquivos</h1>
          <p className="text-muted-foreground">
            Importe arquivos Excel com dados de vendas
          </p>
        </div>

        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Configuração do Arquivo
            </CardTitle>
            <CardDescription>
              Defina as informações do arquivo antes de fazer o upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select
                  value={currentConfig.year}
                  onValueChange={(v) => setCurrentConfig((c) => ({ ...c, year: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select
                  value={currentConfig.month}
                  onValueChange={(v) => setCurrentConfig((c) => ({ ...c, month: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Loja</Label>
                <Select
                  value={currentConfig.store}
                  onValueChange={(v) => setCurrentConfig((c) => ({ ...c, store: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STORES.map((store) => (
                      <SelectItem key={store} value={store}>Loja {store}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subgrupo</Label>
                <Input
                  placeholder="Digite o subgrupo"
                  value={currentConfig.subgroup}
                  onChange={(e) => setCurrentConfig((c) => ({ ...c, subgroup: e.target.value }))}
                />
              </div>
            </div>

            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={uploading}
              />
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <UploadIcon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Clique ou arraste arquivos Excel</p>
                  <p className="text-sm text-muted-foreground">Suporta .xlsx e .xls</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {pendingFiles.length > 0 && (
          <Card className="border-border bg-card shadow-card animate-slide-up">
            <CardHeader>
              <CardTitle>Arquivos Pendentes ({pendingFiles.length})</CardTitle>
              <CardDescription>Revise os arquivos antes de confirmar o upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingFiles.map((pf, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-accent" />
                    <div>
                      <p className="font-medium text-foreground">{pf.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pf.year} • {getMonthLabel(pf.month)} • Loja {pf.store} • {pf.subgroup}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={uploading} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setPendingFiles([])} disabled={uploading}>Limpar Todos</Button>
                <Button onClick={processUpload} disabled={uploading} className="gradient-primary text-primary-foreground shadow-glow">
                  {uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</>) : (<><Check className="mr-2 h-4 w-4" />Confirmar Upload</>)}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Upload;
