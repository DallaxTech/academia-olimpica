'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  orderBy,
  where
} from 'firebase/firestore';
import { 
  ClipboardList, 
  Users, 
  Target, 
  Zap, 
  Activity, 
  TrendingUp, 
  Wrench, 
  Dumbbell, 
  Flame, 
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ArrowUpRight
} from 'lucide-react';

// Define the categories of registration
type CategoryKey = 
  | 'ficha' 
  | 'aluno' 
  | 'objetivo' 
  | 'metodo' 
  | 'ritmo' 
  | 'fase' 
  | 'equipamento' 
  | 'exercicio' 
  | 'pre_treino' 
  | 'pos_treino';

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  isNew: boolean; // True if it's one of the 6 new custom collections
  collectionName?: string; // Firestore collection name (only for new collections)
  externalUrl?: string; // Redirect URL (only for existing collections)
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'ficha',
    label: 'Fichas',
    description: 'Gerencie as fichas e planos de treinamento dos alunos.',
    icon: ClipboardList,
    isNew: false,
    externalUrl: '/dashboard/workouts',
  },
  {
    key: 'aluno',
    label: 'Alunos',
    description: 'Cadastre e gerencie os perfis de alunos (atletas).',
    icon: Users,
    isNew: false,
    externalUrl: '/dashboard/users',
  },
  {
    key: 'objetivo',
    label: 'Objetivos',
    description: 'Cadastre os objetivos principais dos treinos (ex: Hipertrofia, Emagrecimento).',
    icon: Target,
    isNew: true,
    collectionName: 'objectives',
  },
  {
    key: 'metodo',
    label: 'Métodos',
    description: 'Cadastre métodos de treinamento (ex: FST-7, Bi-set, Drop-set).',
    icon: Zap,
    isNew: true,
    collectionName: 'methods',
  },
  {
    key: 'ritmo',
    label: 'Ritmos',
    description: 'Cadastre ritmos e cadências de execução (ex: 2-0-2-0, Controlado).',
    icon: Activity,
    isNew: true,
    collectionName: 'rhythms',
  },
  {
    key: 'fase',
    label: 'Fases de Treino',
    description: 'Cadastre as fases de periodização (ex: Adaptação, Choque, Transição).',
    icon: TrendingUp,
    isNew: true,
    collectionName: 'trainingPhases',
  },
  {
    key: 'equipamento',
    label: 'Equipamentos',
    description: 'Visualize e gerencie as máquinas e aparelhos da academia.',
    icon: Wrench,
    isNew: false,
    externalUrl: '/dashboard/equipment',
  },
  {
    key: 'exercicio',
    label: 'Exercícios',
    description: 'Gerencie a biblioteca global de exercícios físicos.',
    icon: Dumbbell,
    isNew: false,
    externalUrl: '/dashboard/workouts/exercises',
  },
  {
    key: 'pre_treino',
    label: 'Pré Treinos',
    description: 'Cadastre exercícios de aquecimento, mobilidade e ativação pré-treino.',
    icon: Flame,
    isNew: true,
    collectionName: 'preWorkouts',
  },
  {
    key: 'pos_treino',
    label: 'Pós Treinos',
    description: 'Cadastre exercícios de alongamento, desaquecimento e pós-treino.',
    icon: RefreshCw,
    isNew: true,
    collectionName: 'postWorkouts',
  },
];

interface FirestoreRecord {
  id: string;
  name: string;
  description: string;
  [key: string]: any;
}

export default function CadastrosPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<CategoryConfig>(CATEGORIES[0]);
  
  // Data lists
  const [records, setRecords] = useState<FirestoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FirestoreRecord | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Firestore integration for active category
  useEffect(() => {
    if (!firestore) return;
    
    setLoading(true);
    setRecords([]);

    let unsubscribe = () => {};

    if (activeCategory.isNew && activeCategory.collectionName) {
      // Fetch from the custom collection
      const q = query(collection(firestore, activeCategory.collectionName), orderBy('name', 'asc'));
      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FirestoreRecord[];
          setRecords(list);
          setLoading(false);
        },
        (error) => {
          console.error(`Error loading ${activeCategory.collectionName}:`, error);
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar dados',
            description: 'Não foi possível carregar os registros desta categoria.',
          });
          setLoading(false);
        }
      );
    } else {
      // Handle loading logic for existing default collections
      let q;
      if (activeCategory.key === 'ficha') {
        q = query(collection(firestore, 'trainingPlans'), orderBy('name', 'asc'));
      } else if (activeCategory.key === 'aluno') {
        q = query(collection(firestore, 'userProfiles'), where('roleId', '==', 'Athlete'));
      } else if (activeCategory.key === 'equipamento') {
        q = query(collection(firestore, 'equipment'), orderBy('name', 'asc'));
      } else if (activeCategory.key === 'exercicio') {
        q = query(collection(firestore, 'exercises'), orderBy('name', 'asc'));
      }

      if (q) {
        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const list = snapshot.docs.map(doc => {
              const data = doc.data();
              // Normalizing data fields for list view
              return {
                id: doc.id,
                name: data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}` : 'Sem nome'),
                description: data.description || data.email || '',
                ...data
              } as FirestoreRecord;
            });
            setRecords(list);
            setLoading(false);
          },
          (error) => {
            console.error(`Error loading existing collection for ${activeCategory.key}:`, error);
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    }

    return () => unsubscribe();
  }, [activeCategory, firestore, toast]);

  // Handle open dialog to create
  const handleCreateNew = () => {
    setEditingRecord(null);
    setFormData({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  // Handle open dialog to edit
  const handleEdit = (record: FirestoreRecord) => {
    setEditingRecord(record);
    setFormData({ name: record.name, description: record.description });
    setIsDialogOpen(true);
  };

  // Handle submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !activeCategory.collectionName) return;
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Por favor, digite o nome/título.',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingRecord) {
        // Edit existing
        const docRef = doc(firestore, activeCategory.collectionName, editingRecord.id);
        await setDoc(docRef, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        toast({
          title: 'Registro atualizado',
          description: `O item foi atualizado na categoria ${activeCategory.label}.`,
        });
      } else {
        // Create new
        const colRef = collection(firestore, activeCategory.collectionName);
        await addDoc(colRef, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          createdAt: new Date().toISOString()
        });

        toast({
          title: 'Registro adicionado',
          description: `Novo item adicionado com sucesso em ${activeCategory.label}.`,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!firestore || !activeCategory.collectionName) return;
    if (!confirm('Deseja realmente excluir este registro? Esta ação não pode ser desfeita.')) return;

    try {
      await deleteDoc(doc(firestore, activeCategory.collectionName, id));
      toast({
        title: 'Registro removido',
        description: 'O item foi excluído com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o registro.',
      });
    }
  };

  // Filter list by search term
  const filteredRecords = records.filter(record => 
    record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Central de Cadastros" 
        description="Gerencie todas as categorias, tabelas auxiliares e cadastros do sistema em um só lugar."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 scrollbar-none">
              {CATEGORIES.map(category => {
                const IconComponent = category.icon;
                const isActive = activeCategory.key === category.key;
                return (
                  <button
                    key={category.key}
                    onClick={() => {
                      setActiveCategory(category);
                      setSearchTerm('');
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap lg:whitespace-normal w-full justify-start shrink-0 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold' 
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    <IconComponent className={`h-4.5 w-4.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card className="border-primary/10 bg-card/30 backdrop-blur-sm h-full flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2 text-foreground font-headline">
                  <activeCategory.icon className="h-5 w-5 text-primary" />
                  {activeCategory.label}
                </CardTitle>
                <CardDescription>{activeCategory.description}</CardDescription>
              </div>
              <div>
                {activeCategory.isNew ? (
                  <Button onClick={handleCreateNew} className="shadow-md shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Novo
                  </Button>
                ) : (
                  categoryRedirectButton(activeCategory)
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Search Bar */}
              <div className="p-4 border-b bg-muted/10 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar registros..." 
                    className="pl-9 bg-background/40 border-primary/15" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {!activeCategory.isNew && (
                  <Badge variant="outline" className="hidden sm:inline-flex bg-background/50 border-dashed border-primary/30">
                    Integrado ao App
                  </Badge>
                )}
              </div>

              {/* List Records */}
              <div className="flex-1 overflow-x-auto min-h-[300px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span>Carregando dados...</span>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <span>Nenhum registro encontrado.</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-1/3">Nome / Título</TableHead>
                        <TableHead>
                          {activeCategory.key === 'aluno' ? 'E-mail' : 'Descrição / Detalhes'}
                        </TableHead>
                        {activeCategory.key === 'aluno' && <TableHead>Data de Registro</TableHead>}
                        {activeCategory.key === 'ficha' && <TableHead>Status</TableHead>}
                        {activeCategory.isNew && <TableHead className="text-right w-32">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold text-foreground">
                            {record.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-md truncate">
                            {activeCategory.key === 'aluno' ? record.email : record.description}
                          </TableCell>
                          {activeCategory.key === 'aluno' && (
                            <TableCell className="text-muted-foreground text-sm">
                              {record.registrationDate ? new Date(record.registrationDate).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                          )}
                          {activeCategory.key === 'ficha' && (
                            <TableCell>
                              <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 font-normal">
                                Ativo
                              </Badge>
                            </TableCell>
                          )}
                          {activeCategory.isNew && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEdit(record)}
                                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDelete(record.id)}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog for Custom Forms */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-md text-foreground">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-headline">
                <activeCategory.icon className="h-5 w-5 text-primary" />
                {editingRecord ? 'Editar Registro' : 'Novo Registro'} - {activeCategory.label}
              </DialogTitle>
              <DialogDescription>
                Insira as informações do item para cadastro na biblioteca global de {activeCategory.label.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  {activeCategory.key === 'ritmo' ? 'Ritmo / Cadência' : 'Nome / Título'}
                </Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    activeCategory.key === 'ritmo' 
                      ? 'Ex: 2-0-2-0 ou Controlado' 
                      : activeCategory.key === 'metodo' 
                      ? 'Ex: FST-7 ou Drop-set'
                      : 'Nome descritivo...'
                  }
                  className="bg-background/50 border-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Descrição / Detalhes
                </Label>
                <Input 
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Instruções, observações ou detalhes adicionais..."
                  className="bg-background/50 border-primary/20"
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-4 bg-muted/20">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="shadow-lg shadow-primary/20 px-6">
                {saving ? 'Salvando...' : 'Salvar Registro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Redirect action button renderer for existing views
function categoryRedirectButton(category: CategoryConfig) {
  if (!category.externalUrl) return null;
  return (
    <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/5">
      <Link href={category.externalUrl}>
        Gerenciar {category.label}
        <ArrowUpRight className="h-4 w-4 ml-2 text-primary" />
      </Link>
    </Button>
  );
}
