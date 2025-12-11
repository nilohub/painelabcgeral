import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CalendarIcon, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferUploadProps {
  onUploadSuccess: () => void;
}

const OFFER_TYPES = [
  { value: "semanal", label: "Semanal" },
  { value: "comerciante", label: "Comerciante" },
  { value: "especial_carnes", label: "Especial de Carnes" },
  { value: "final_de_semana", label: "Final de Semana" },
  { value: "super_feira", label: "Super Feira" },
];

const LAMINA_OPTIONS = [1, 2, 3, 4, 5];

const OfferUpload = ({ onUploadSuccess }: OfferUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [offerType, setOfferType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [laminaNumber, setLaminaNumber] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const parseNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/\./g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!offerType || !startDate || !endDate || !laminaNumber || !selectedFile) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de fazer o upload.",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Datas inválidas",
        description: "A data final deve ser maior que a data inicial.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const rows = await parseExcelFile(selectedFile);
      
      // Skip header row
      const dataRows = rows.slice(1).filter((row: any[]) => row[3] && row[4]);

      // Create offer record
      const { data: offerData, error: offerError } = await supabase
        .from("offers")
        .insert({
          offer_type: offerType,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          lamina_number: parseInt(laminaNumber),
          file_name: selectedFile.name,
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Parse and insert products
      const products = dataRows.map((row: any[]) => ({
        offer_id: offerData.id,
        session_name: row[1]?.toString() || null,
        other_codes: row[2]?.toString() || null,
        main_code: row[3]?.toString() || "",
        description: row[4]?.toString() || "",
        management_cost: parseNumber(row[5]),
        price_vila_shopping: row[6] ? parseNumber(row[6]) : null,
        price_xavantina: row[7] ? parseNumber(row[7]) : null,
        price_agua_boa: row[8] ? parseNumber(row[8]) : null,
        price_querencia: row[9] ? parseNumber(row[9]) : null,
        price_jussara: row[10] ? parseNumber(row[10]) : null,
        promo_price: parseNumber(row[11]),
        margin: row[12] ? parseNumber(row[12]) : null,
        cpf_limit: row[13] ? parseInt(row[13]) : null,
        promo_type: row[14]?.toString()?.toLowerCase() === "clube" ? "clube" : "geral",
      }));

      const { error: productsError } = await supabase
        .from("offer_products")
        .insert(products);

      if (productsError) throw productsError;

      toast({
        title: "Upload concluído!",
        description: `${products.length} produtos foram adicionados à oferta.`,
      });

      // Reset form
      setOfferType("");
      setStartDate(undefined);
      setEndDate(undefined);
      setLaminaNumber("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Oferta</CardTitle>
          <CardDescription>
            Selecione o tipo de oferta, período e número da lâmina
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Oferta</Label>
              <Select value={offerType} onValueChange={setOfferType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Número da Lâmina</Label>
              <Select value={laminaNumber} onValueChange={setLaminaNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LAMINA_OPTIONS.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Lâmina {num.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload do Arquivo</CardTitle>
          <CardDescription>
            Selecione o arquivo Excel com os dados da oferta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              selectedFile
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-4">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="ml-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Arraste o arquivo ou clique para selecionar</p>
                  <p className="text-sm text-muted-foreground">
                    Arquivo Excel (.xlsx, .xls)
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !offerType || !startDate || !endDate || !laminaNumber}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Confirmar Upload
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapeamento de Colunas</CardTitle>
          <CardDescription>
            Estrutura esperada do arquivo Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-muted rounded"><strong>A:</strong> Ignorar</div>
            <div className="p-2 bg-muted rounded"><strong>B:</strong> Nome da Sessão</div>
            <div className="p-2 bg-muted rounded"><strong>C:</strong> Demais Códigos</div>
            <div className="p-2 bg-muted rounded"><strong>D:</strong> Código Principal</div>
            <div className="p-2 bg-muted rounded"><strong>E:</strong> Descrição</div>
            <div className="p-2 bg-muted rounded"><strong>F:</strong> Custo Gerencial (R$)</div>
            <div className="p-2 bg-muted rounded"><strong>G:</strong> Preço Vila/Shopping</div>
            <div className="p-2 bg-muted rounded"><strong>H:</strong> Preço Xavantina</div>
            <div className="p-2 bg-muted rounded"><strong>I:</strong> Preço Água Boa</div>
            <div className="p-2 bg-muted rounded"><strong>J:</strong> Preço Querência</div>
            <div className="p-2 bg-muted rounded"><strong>K:</strong> Preço Jussara</div>
            <div className="p-2 bg-muted rounded"><strong>L:</strong> Preço Promocional</div>
            <div className="p-2 bg-muted rounded"><strong>M:</strong> Margem (%)</div>
            <div className="p-2 bg-muted rounded"><strong>N:</strong> Limite por CPF</div>
            <div className="p-2 bg-muted rounded"><strong>O:</strong> Tipo (Geral/Clube)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferUpload;
