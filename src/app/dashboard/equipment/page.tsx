'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Wrench, 
  MoreVertical, 
  Edit2, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore } from '@/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { Equipment } from '@/lib/types';
import { EquipmentDialog } from '@/components/equipment-dialog';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  maintenance: { label: 'Manutenção', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  broken: { label: 'Quebrado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
};

export default function EquipmentPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeedEquipments = async () => {
    if (!firestore) return;
    setSeeding(true);
    
    const defaultEquipments = [
      { name: 'Abdutor', category: 'Máquina', description: 'Aparelho para fortalecimento dos músculos abdutores do quadril.', status: 'active' as const },
      { name: 'Adutor', category: 'Máquina', description: 'Aparelho para fortalecimento dos músculos adutores do quadril.', status: 'active' as const },
      { name: 'Extensor', category: 'Máquina', description: 'Aparelho (Cadeira Extensora) para fortalecimento do quadríceps.', status: 'active' as const },
      { name: 'Leg Press Horizontal', category: 'Máquina', description: 'Aparelho para fortalecimento de membros inferiores com empurrão horizontal.', status: 'active' as const },
      { name: 'Leg Press 45⁰', category: 'Máquina', description: 'Aparelho de Leg Press 45 graus para membros inferiores.', status: 'active' as const },
      { name: 'Tibial Maquina', category: 'Máquina', description: 'Aparelho específico para fortalecimento do músculo tibial anterior.', status: 'active' as const },
      { name: 'Banco Lombar', category: 'Peso Livre', description: 'Banco para extensão lombar (hiperextensão).', status: 'active' as const },
      { name: 'Paralela', category: 'Peso Livre', description: 'Barras paralelas para treinos de tríceps, peitoral e ombros.', status: 'active' as const },
      { name: 'Gravitron', category: 'Máquina', description: 'Aparelho com assistência de peso para barra fixa e paralelas.', status: 'active' as const },
      { name: 'Escada', category: 'Cardio', description: 'Simulador de escadas para treino cardiovascular de alta intensidade.', status: 'active' as const },
      { name: 'Agachamento barra livre', category: 'Peso Livre', description: 'Treino de agachamento clássico com barra olímpica e anilhas.', status: 'active' as const },
      { name: 'Pulley', category: 'Máquina', description: 'Puxador alto para treino de dorsais e tríceps.', status: 'active' as const },
      { name: 'Remada Sentada Maquina com Apoio', category: 'Máquina', description: 'Máquina de remada com suporte no peito para dorsal.', status: 'active' as const },
      { name: 'Remada Sentada baixa maquina', category: 'Máquina', description: 'Remada baixa cabo para treino de costas.', status: 'active' as const },
      { name: 'Crucifixo maquina', category: 'Máquina', description: 'Aparelho Pec Deck / Voador para peitoral e posterior de ombro.', status: 'active' as const },
      { name: 'Supimo vertical', category: 'Máquina', description: 'Aparelho de supino sentado para peitoral.', status: 'active' as const },
      { name: 'Agachamento Syssi', category: 'Peso Livre', description: 'Banco de agachamento Sissy para isolamento do quadríceps.', status: 'active' as const },
    ];

    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const colRef = collection(firestore, 'equipment');
      
      let count = 0;
      for (const eq of defaultEquipments) {
        const exists = equipment.some(item => item.name.toLowerCase() === eq.name.toLowerCase());
        if (!exists) {
          await addDoc(colRef, {
            ...eq,
            createdAt: serverTimestamp(),
          });
          count++;
        }
      }
      
      toast({
        title: 'Cadastro concluído',
        description: count > 0 
          ? `${count} novos equipamentos foram cadastrados com sucesso!` 
          : 'Todos os equipamentos padrão já estavam cadastrados.',
      });
    } catch (error) {
      console.error('Error seeding equipment:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar a lista padrão.',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, 'equipment'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipment[];
      setEquipment(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleDelete = async (id: string) => {
    if (!firestore || !confirm('Tem certeza que deseja excluir este equipamento?')) return;

    try {
      await deleteDoc(doc(firestore, 'equipment', id));
      toast({ title: 'Excluído', description: 'Equipamento removido com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    }
  };

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Equipamentos"
          description="Gerencie os aparelhos e dispositivos da academia."
        />
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleSeedEquipments} 
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2 text-primary" />
            )}
            Cadastrar Equipamentos Padrão
          </Button>
          <Button onClick={() => { setSelectedEquipment(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou categoria..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Carregando equipamentos...
                    </TableCell>
                  </TableRow>
                ) : filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Nenhum equipamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map((item) => {
                    const status = statusConfig[item.status] || statusConfig.active;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <Wrench className="w-4 h-4 text-primary" />
                            </div>
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal capitalize">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} border font-medium flex items-center gap-1.5 w-fit`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedEquipment(item); setIsDialogOpen(true); }}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EquipmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        equipment={selectedEquipment}
        onSuccess={() => {}}
      />
    </div>
  );
}
