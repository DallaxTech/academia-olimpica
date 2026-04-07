'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Loader2, Upload, X, Check, Video } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Core', 'Cardio', 'Glúteos', 'Panturrilha'
];

const EQUIPMENTS = [
  'Halter', 'Barra', 'Máquina', 'Polia', 'Peso do Corpo', 'Elástico', 'Kettlebell'
];

export default function NewExercisePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();

  const [saving, setSaving] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
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
    if (!user) return '';
    
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
    if (!user || !firestore) return;

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

      await addDoc(collection(firestore, 'exercises'), {
        ...formData,
        videoUrl: finalVideoUrl,
        createdByUserId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Sucesso!',
        description: 'Exercício cadastrado com sucesso!',
      });
      router.push('/dashboard/workouts/exercises');
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar o exercício.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Novo Exercício"
        description="Cadastre um novo exercício na biblioteca para usar em suas fichas de treino."
      />

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Preencha os detalhes técnicos do exercício.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Exercício</Label>
                <Input
                  id="name"
                  placeholder="Ex: Supino Reto com Barra"
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <Label>Mídia de Execução</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL Externa (Youtube/Drive)</Label>
                  <Input
                    placeholder="https://..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    disabled={!!videoFile}
                  />
                </div>
                
                <div className="relative">
                  <Label className="text-xs text-muted-foreground">Upload de Vídeo (Máx 50MB)</Label>
                  <div className={`mt-1 border-2 border-dashed rounded-lg p-4 transition-colors flex flex-col items-center justify-center gap-2 ${videoFile ? 'border-primary/50 bg-primary/5' : 'border-muted hover:border-primary/30'}`}>
                    {videoFile ? (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Video className="w-4 h-4 text-primary" />
                          <span className="truncate max-w-[150px]">{videoFile.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setVideoFile(null)}
                            className="p-1 hover:bg-muted rounded-full"
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
                        <span className="text-xs text-muted-foreground">Arraste ou clique para selecionar</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={!!videoUrl}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              {videoUrl && videoFile && (
                <p className="text-[10px] text-yellow-500">Aviso: O arquivo enviado terá prioridade sobre a URL.</p>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || uploading} className="min-w-[120px]">
                {saving || uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploading ? 'Enviando...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Cadastrar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
