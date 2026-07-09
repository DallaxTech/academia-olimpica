'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ExerciseImport {
  name: string;
  description: string;
  muscleGroup?: string;
  equipment?: string;
  videoUrl?: string;
}

export default function ImportExercisesPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [data, setData] = useState<ExerciseImport[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        // Map and validate
        const mappedData: ExerciseImport[] = json.map((row: any) => ({
          name: row.Nome || row.name || row.Name || '',
          description: row.Descrição || row.description || row.Description || '',
          muscleGroup: row.Grupo || row.muscleGroup || row.Group || '',
          equipment: row.Equipamento || row.equipment || row.Equipment || '',
          videoUrl: row.Video || row.videoUrl || row.VideoUrl || '',
        })).filter(ex => ex.name);

        if (mappedData.length === 0) {
          throw new Error('Nenhum exercício válido encontrado no arquivo. Verifique as colunas (Ex: Nome, Descrição, Grupo).');
        }

        setData(mappedData);
      } catch (err: any) {
        setError(err.message || 'Erro ao processar o arquivo.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
      setIsParsing(false);
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleImport = async () => {
    if (!firestore || !user || data.length === 0) return;

    setIsImporting(true);
    try {
      const batch = writeBatch(firestore);
      const exercisesRef = collection(firestore, 'exercises');

      data.forEach((exercise) => {
        const newDocRef = doc(exercisesRef);
        batch.set(newDocRef, {
          ...exercise,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        });
      });

      await batch.commit();
      
      toast({
        title: "Sucesso!",
        description: `${data.length} exercícios foram importados com sucesso.`,
      });
      
      router.push('/dashboard/workouts/exercises');
    } catch (err: any) {
      toast({
        title: "Erro na importação",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const clearData = () => {
    setData([]);
    setError(null);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <Link 
        href="/dashboard/workouts/exercises" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Biblioteca
      </Link>

      <PageHeader
        title="Importar Exercícios"
        description="Carregue sua planilha de exercícios para o sistema de forma rápida."
      />

      {!data.length ? (
        <Card className="border-dashed bg-card/30">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Selecione sua planilha</CardTitle>
            <CardDescription>
              Arraste um arquivo Excel (.xlsx, .xls) ou clique para procurar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <label 
                className={cn(
                  "w-full max-w-md h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all",
                  "border-muted hover:border-primary group hover:bg-primary/5",
                  error && "border-destructive hover:border-destructive/80 bg-destructive/5"
                )}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <FileSpreadsheet className="w-10 h-10 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                      <p className="text-sm text-muted-foreground group-hover:text-primary font-medium">Click para selecionar</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={isParsing} />
              </label>

              {error && (
                <div className="mt-4 flex items-center text-destructive text-sm font-medium">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                  <h4 className="text-sm font-bold flex items-center mb-2">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Colunas Suportadas
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Nome (Obrigatório)</li>
                    <li>• Descrição</li>
                    <li>• Grupo Muscular</li>
                    <li>• Equipamento</li>
                    <li>• Link do Vídeo (URL)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                  <h4 className="text-sm font-bold flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 mr-2 text-primary" /> Dica de Formato
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Certifique-se de que a primeira linha contém os nomes das colunas. O sistema tentará identificar os campos automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Pré-visualização</CardTitle>
                <CardDescription>
                  Encontramos {data.length} exercícios no arquivo. Revise-os abaixo.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={clearData} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <X className="w-4 h-4 mr-2" /> Limpar e trocar arquivo
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exercício</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead className="max-w-[300px]">Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 50).map((ex, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold">{ex.name}</TableCell>
                        <TableCell>{ex.muscleGroup || '-'}</TableCell>
                        <TableCell>{ex.equipment || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {ex.description || 'Sem descrição'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.length > 50 && (
                  <div className="p-4 text-center text-xs text-muted-foreground border-t">
                    Exibindo apenas os primeiros 50 itens...
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={clearData} disabled={isImporting}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmar e Salvar {data.length} Itens
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
