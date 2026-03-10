import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle,
  Truck, Users, Package, Handshake, Loader2, ArrowRight, ArrowLeft, X,
} from "lucide-react";

// ──────── Entity definitions ────────
interface EntityConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  table: string;
  columns: { header: string; dbField: string; required: boolean }[];
  sampleRows: string[][];
}

const entities: EntityConfig[] = [
  {
    key: "suppliers",
    label: "Proveedores",
    icon: <Truck className="w-5 h-5" />,
    table: "suppliers",
    columns: [
      { header: "nombre", dbField: "name", required: true },
      { header: "cif", dbField: "tax_id", required: false },
      { header: "email", dbField: "email", required: false },
      { header: "telefono", dbField: "phone", required: false },
      { header: "calle", dbField: "address", required: false },
      { header: "numero", dbField: "street_number", required: false },
      { header: "piso", dbField: "floor", required: false },
      { header: "adicional", dbField: "address_extra", required: false },
      { header: "ciudad", dbField: "city", required: false },
      { header: "provincia", dbField: "province", required: false },
      { header: "contacto", dbField: "contact_person", required: false },
      { header: "iban", dbField: "iban", required: false },
      { header: "condiciones_pago", dbField: "payment_terms", required: false },
      { header: "dias_vencimiento", dbField: "due_days", required: false },
      { header: "notas", dbField: "notes", required: false },
    ],
    sampleRows: [
      ["Fontanería López SL", "B12345678", "info@fontanerialopez.es", "912345678", "C/ Mayor", "10", "2ºA", "", "Madrid", "Madrid", "Juan López", "ES12 1234 5678 90 1234567890", "Contado", "30", "Proveedor habitual"],
      ["Electricidad Norte SA", "A87654321", "ventas@elecnorte.es", "934567890", "Av. Diagonal", "100", "", "Local 3", "Barcelona", "Barcelona", "María García", "", "Transferencia", "60", ""],
    ],
  },
  {
    key: "clients",
    label: "Clientes",
    icon: <Users className="w-5 h-5" />,
    table: "clients",
    columns: [
      { header: "nombre", dbField: "name", required: true },
      { header: "dni", dbField: "dni", required: false },
      { header: "email", dbField: "email", required: false },
      { header: "telefono", dbField: "phone", required: false },
      { header: "calle", dbField: "address", required: false },
      { header: "numero", dbField: "street_number", required: false },
      { header: "piso", dbField: "floor", required: false },
      { header: "adicional", dbField: "address_extra", required: false },
      { header: "codigo_postal", dbField: "postal_code", required: false },
      { header: "ciudad", dbField: "city", required: false },
      { header: "provincia", dbField: "province", required: false },
      { header: "plan", dbField: "plan_type", required: false },
    ],
    sampleRows: [
      ["María García López", "12345678A", "maria@email.com", "612345678", "C/ Gran Vía", "45", "2ºA", "", "28013", "Madrid", "Madrid", "Agua"],
      ["Carlos Fernández Ruiz", "23456789B", "carlos@email.com", "623456789", "Av. Diagonal", "230", "", "Esc. B", "08018", "Barcelona", "Barcelona", "Clima"],
    ],
  },
  {
    key: "articles",
    label: "Artículos",
    icon: <Package className="w-5 h-5" />,
    table: "articles",
    columns: [
      { header: "titulo", dbField: "title", required: true },
      { header: "descripcion", dbField: "description", required: false },
      { header: "categoria", dbField: "category", required: false },
      { header: "especialidad", dbField: "specialty", required: false },
      { header: "precio_coste", dbField: "cost_price", required: true },
      { header: "pvp", dbField: "pvp", required: false },
      { header: "unidad", dbField: "unit", required: false },
    ],
    sampleRows: [
      ["Tubería cobre 22mm", "Tubería de cobre para agua, por metro lineal", "Material", "Fontanería/Agua", "14.25", "17.95", "m"],
      ["Hora fontanero", "Mano de obra oficial fontanero", "Mano_de_Obra", "Fontanería/Agua", "35.00", "", "h"],
    ],
  },
  {
    key: "collaborators",
    label: "Colaboradores",
    icon: <Handshake className="w-5 h-5" />,
    table: "collaborators",
    columns: [
      { header: "id", dbField: "id", required: true },
      { header: "empresa", dbField: "company_name", required: true },
      { header: "categoria", dbField: "category", required: false },
      { header: "email", dbField: "email", required: false },
      { header: "telefono", dbField: "phone", required: false },
      { header: "contacto", dbField: "contact_person", required: false },
    ],
    sampleRows: [
      ["COL-001", "Fincas Reunidas SL", "Administrador", "info@fincasreunidas.es", "911234567", "Antonio Pérez"],
      ["COL-002", "InmoGest BCN", "Corredor", "contacto@inmogestbcn.es", "932345678", "Montse Vila"],
    ],
  },
];

// ──────── CSV helpers ────────
function generateCsv(entity: EntityConfig): string {
  const header = entity.columns.map((c) => c.header).join(";");
  const rows = entity.sampleRows.map((r) => r.join(";")).join("\n");
  return `${header}\n${rows}`;
}

function downloadCsv(entity: EntityConfig) {
  const csv = generateCsv(entity);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `plantilla_${entity.key}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => line.split(";").map((c) => c.trim()));
}

// ──────── Steps ────────
type Step = "select" | "upload" | "preview" | "importing" | "done";

export default function BulkImportTab() {
  const [step, setStep] = useState<Step>("select");
  const [selectedEntity, setSelectedEntity] = useState<EntityConfig | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("select");
    setSelectedEntity(null);
    setParsedData([]);
    setErrors([]);
    setImportResult({ success: 0, failed: 0 });
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedEntity) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length < 2) {
          setErrors(["El archivo debe tener al menos una fila de cabecera y una de datos."]);
          return;
        }

        const headers = rows[0].map((h) => h.toLowerCase().replace(/\s/g, "_"));
        const dataRows = rows.slice(1);
        const errs: string[] = [];
        const mapped: Record<string, string>[] = [];

        // Validate headers
        const requiredHeaders = selectedEntity.columns.filter((c) => c.required).map((c) => c.header);
        for (const rh of requiredHeaders) {
          if (!headers.includes(rh)) {
            errs.push(`Columna obligatoria "${rh}" no encontrada en el archivo.`);
          }
        }

        if (errs.length > 0) {
          setErrors(errs);
          return;
        }

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const obj: Record<string, string> = {};
          let rowValid = true;

          for (const col of selectedEntity.columns) {
            const idx = headers.indexOf(col.header);
            const val = idx >= 0 && idx < row.length ? row[idx] : "";
            if (col.required && !val) {
              errs.push(`Fila ${i + 2}: campo obligatorio "${col.header}" vacío.`);
              rowValid = false;
            }
            obj[col.dbField] = val;
          }

          if (rowValid) mapped.push(obj);
        }

        setParsedData(mapped);
        setErrors(errs);
        setStep("preview");
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [selectedEntity]
  );

  const doImport = useCallback(async () => {
    if (!selectedEntity || parsedData.length === 0) return;
    setStep("importing");

    let success = 0;
    let failed = 0;

    // Build insert rows based on entity
    const insertRows = parsedData.map((row) => {
      const obj: Record<string, any> = {};
      for (const col of selectedEntity.columns) {
        let val: any = row[col.dbField] ?? "";
        // Handle numeric fields
        if (["due_days", "cost_price", "pvp"].includes(col.dbField)) {
          val = val ? Number(val.replace(",", ".")) : col.dbField === "due_days" ? 30 : 0;
        }
        if (val !== "" || col.required) {
          obj[col.dbField] = val;
        }
      }
      return obj;
    });

    // For clients/articles we don't have a real table yet — use mock approach
    if (selectedEntity.table === "clients" || selectedEntity.table === "articles") {
      // These are mock-only for now
      toast.info(`Se han preparado ${insertRows.length} ${selectedEntity.label.toLowerCase()} para importar. La tabla de ${selectedEntity.label.toLowerCase()} se creará cuando se migre de datos mock.`);
      success = insertRows.length;
    } else {
      // Insert in batches of 50
      for (let i = 0; i < insertRows.length; i += 50) {
        const batch = insertRows.slice(i, i + 50);
        const { error } = await supabase.from(selectedEntity.table as any).insert(batch as any);
        if (error) {
          console.error("Bulk insert error:", error);
          failed += batch.length;
        } else {
          success += batch.length;
        }
      }
    }

    setImportResult({ success, failed });
    setStep("done");
  }, [selectedEntity, parsedData]);

  const stepIdx = ["select", "upload", "preview", "importing", "done"].indexOf(step);
  const progressPercent = (stepIdx / 4) * 100;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Importación masiva de datos
          </CardTitle>
          <CardDescription>Sube un archivo CSV para importar proveedores, clientes, artículos o colaboradores de forma masiva</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={cn(stepIdx >= 0 && "text-primary font-medium")}>1. Seleccionar</span>
              <span className={cn(stepIdx >= 1 && "text-primary font-medium")}>2. Subir CSV</span>
              <span className={cn(stepIdx >= 2 && "text-primary font-medium")}>3. Previsualizar</span>
              <span className={cn(stepIdx >= 4 && "text-primary font-medium")}>4. Resultado</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select entity */}
      {step === "select" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entities.map((entity) => (
            <Card
              key={entity.key}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                selectedEntity?.key === entity.key && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => {
                setSelectedEntity(entity);
                setStep("upload");
              }}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {entity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground">{entity.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entity.columns.filter((c) => c.required).length} campos obligatorios · {entity.columns.length} columnas
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Upload */}
      {step === "upload" && selectedEntity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {selectedEntity.icon}
              Importar {selectedEntity.label}
            </CardTitle>
            <CardDescription>Sube un archivo CSV con los datos. Descarga primero la plantilla como referencia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Template info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">Plantilla CSV</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Separador: punto y coma (;) · Codificación: UTF-8
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadCsv(selectedEntity)}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar plantilla
                </Button>
              </div>

              {/* Columns reference */}
              <div className="flex flex-wrap gap-1.5">
                {selectedEntity.columns.map((col) => (
                  <Badge
                    key={col.header}
                    variant={col.required ? "default" : "secondary"}
                    className="text-[11px]"
                  >
                    {col.header}{col.required && " *"}
                  </Badge>
                ))}
              </div>

              {/* Sample preview */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {selectedEntity.columns.map((col) => (
                        <th key={col.header} className="text-left px-2 py-1.5 text-muted-foreground font-medium whitespace-nowrap">
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEntity.sampleRows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1.5 text-muted-foreground whitespace-nowrap max-w-[150px] truncate">
                            {cell || <span className="italic opacity-50">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upload area */}
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-card-foreground">Arrastra o haz clic para subir tu CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Archivo .csv con separador ; (punto y coma)</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />

            {errors.length > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {err}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={reset}><ArrowLeft className="w-4 h-4 mr-1" /> Atrás</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && selectedEntity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previsualización de datos</CardTitle>
            <CardDescription>
              Se importarán <strong className="text-foreground">{parsedData.length}</strong> registros de {selectedEntity.label.toLowerCase()}.
              {errors.length > 0 && (
                <span className="text-destructive ml-1">({errors.length} filas con errores no se importarán)</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">#</th>
                    {selectedEntity.columns.map((col) => (
                      <th key={col.header} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 100).map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                      {selectedEntity.columns.map((col) => (
                        <td key={col.dbField} className="px-3 py-1.5 text-card-foreground whitespace-nowrap max-w-[180px] truncate">
                          {row[col.dbField] || <span className="text-muted-foreground italic">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 100 && (
              <p className="text-xs text-muted-foreground text-center">Mostrando las primeras 100 filas de {parsedData.length}</p>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("upload")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
              </Button>
              <Button onClick={doImport}>
                <Upload className="w-4 h-4 mr-1" /> Importar {parsedData.length} registros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3.5: Importing */}
      {step === "importing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-card-foreground">Importando datos…</p>
            <p className="text-xs text-muted-foreground">No cierres esta ventana.</p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            {importResult.failed === 0 ? (
              <CheckCircle2 className="w-14 h-14 text-success" />
            ) : (
              <AlertCircle className="w-14 h-14 text-warning" />
            )}
            <div className="text-center">
              <p className="text-lg font-semibold text-card-foreground">Importación completada</p>
              <p className="text-sm text-muted-foreground mt-1">
                {importResult.success > 0 && (
                  <span className="text-success font-medium">{importResult.success} registros importados correctamente</span>
                )}
                {importResult.failed > 0 && (
                  <span className="text-destructive font-medium ml-2">· {importResult.failed} con errores</span>
                )}
              </p>
            </div>
            <Button onClick={reset} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-1" /> Nueva importación
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
