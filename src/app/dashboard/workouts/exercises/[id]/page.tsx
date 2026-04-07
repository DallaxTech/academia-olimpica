'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useStorage, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Loader2, Upload, X, Check, Video, Trash2, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core', 'Cardio', 'Glúteos', 'Panturrilha'
];

const EQUIPMENTS = [
  'Halter', 'Barra', 'Máquina', 'Polia', 'Peso do Corpo', 'Elástico', 'Kettlebell'
];

export default function ExerciseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  
  const id = params.id as string;
  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'exercises', id);
  }, [firestore, id]);
  
  const { data: exercise, isLoading: isLoadingDoc } = useDoc<any>(docRef); // explicitly type as any for dynamic access

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    muscleGroup: '',
    equipment: '',
  });

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name || '',
        description: exercise.description || '',
        muscleGroup: exercise.muscleGroup || '',
        equipment: exercise.equipment || '',
      });
      setVideoUrl(exercise.videoUrl || '');
    }
  }, [exercise]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { 
        toast({
          title: 'Erro no arquivo',
          description: 'O vídeo é muito grande. Limite de 50MB.',
          variant: 'destructive',
        });
        return;
      }
      setVideoFile(file);
    }
  };

  const uploadVideo = async (file: File) => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `exercises/videos/${fileName}`);
    
    setUploading(true);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setUploading(false);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploading(false);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !docRef) return;

    if (!formData.name) {
      toast({
        title: 'Campo obrigatório',
        description: 'O nome do exercício é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      let finalVideoUrl = videoUrl;
      
      if (videoFile) {
        finalVideoUrl = await uploadVideo(videoFile);
      }

      await updateDoc(docRef, {
        ...formData,
        videoUrl: finalVideoUrl,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Sucesso!',
        description: 'Exercício atualizado com sucesso!',
      });
      router.push('/dashboard/workouts/exercises');
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao atualizar o exercício.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este exercício? Ele pode estar sendo usado em fichas de treino.')) {
        if (!firestore || !docRef) return;
        setDeleting(true);
        try {
            await deleteDoc(docRef);
            toast({ title: 'Excluído', description: 'O exercício foi removido.' });
            router.push('/dashboard/workouts/exercises');
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
        } finally {
            setDeleting(false);
        }
    }
  };

  if (isLoadingDoc) {
      return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!exercise) {
      return (
          <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
              <h2 className="text-2xl font-bold">Exercício não encontrado</h2>
              <Button onClick={() => router.push('/dashboard/workouts/exercises')}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
          <PageHeader
            title="Detalhes do Exercício"
            description="Visualize e edite as propriedades deste exercício da biblioteca."
          />
          <Button variant="ghost" className="mt-4 md:mt-0" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
      </div>

      <Card className="bg-card/40">
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Edite os detalhes técnicos do exercício.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Exercício</Label>
                <Input
                  id="name"
                  placeholder="Ex: Supino Reto com Barra"
                  className="bg-background/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="muscleGroup">Grupo Muscular Principal</Label>
                <Select 
                  onValueChange={(val) => setFormData({ ...formData, muscleGroup: val })}
                  value={formData.muscleGroup}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipamento</Label>
                <Select 
                  onValueChange={(val) => setFormData({ ...formData, equipment: val })}
                  value={formData.equipment}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENTS.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição / Instruções</Label>
              <Textarea
                id="description"
                placeholder="Explique a execução correta, postura e dicas..."
                rows={4}
                className="bg-background/50"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <Label>Mídia de Execução</Label>
              {exercise.videoUrl && !videoUrl && !videoFile && (
                  <div className="mb-4">
                      <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Video className="w-4 h-4 mr-2"/> Ver vídeo ativo
                      </a>
                  </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL Externa (Youtube/Drive)</Label>
                  <Input
                    placeholder="https://..."
                    value={videoUrl}
                    className="bg-background/50"
                    onChange={(e) => setVideoUrl(e.target.value)}
                    disabled={!!videoFile}
                  />
                </div>
                
                <div className="relative">
                  <Label className="text-xs text-muted-foreground">Substituir Vídeo (Máx 50MB)</Label>
                  <div className={`mt-1 border-2 border-dashed rounded-lg p-4 transition-colors flex flex-col items-center justify-center gap-2 ${videoFile ? 'border-primary/50 bg-primary/5' : 'border-muted hover:border-primary/30'}`}>
                    {videoFile ? (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Video className="w-4 h-4 text-primary" />
                          <span className="truncate max-w-[150px]">{videoFile.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setVideoFile(null)}
                            className="p-1 hover:bg-muted rounded-full bg-background"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {uploading && (
                          <div className="w-full space-y-1 mt-2">
                            <Progress value={uploadProgress} className="h-1" />
                            <p className="text-[10px] text-center text-muted-foreground">{Math.round(uploadProgress)}%</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-center px-4 text-muted-foreground">Arraste ou clique para trocar o vídeo do Firebase</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center sm:pt-4 border-t gap-4 mt-8">
              <Button type="button" variant="destructive" className="w-full sm:w-auto bg-destructive/10 text-destructive hover:bg-destructive/20 border-none" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />} 
                  {deleting ? 'Excluindo...' : 'Excluir Exercício'}
              </Button>
              <div className="flex w-full sm:w-auto gap-4">
                  <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || uploading} className="min-w-[120px] flex-1 sm:flex-none">
                    {saving || uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploading ? 'Enviando...' : 'Salvar'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Salvar Edição
                      </>
                    )}
                  </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
