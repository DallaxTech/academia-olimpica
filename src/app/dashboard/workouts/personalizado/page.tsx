'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, onSnapshot, writeBatch, serverTimestamp, where } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  User, 
  Target, 
  Zap, 
  Activity, 
  TrendingUp, 
  Wrench, 
  Dumbbell, 
  Apple, 
  Coffee,
  Check,
  Flame,
  RefreshCw,
  GripVertical,
  MoreVertical,
  Power,
  Eye,
  EyeOff
} from 'lucide-react';
import { Role, UserProfile } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  load: string;
  videoUrl?: string;
  description?: string;
  isTimeBased?: boolean;
  durationMinutes?: number;
}

interface WorkoutDay {
  name: string;
  exercises: CustomExercise[];
  isEnabled?: boolean;
}

interface WorkoutTab {
  name: string;
  isEnabled: boolean;
  objectiveName: string;
  methodName: string;
  rhythmName: string;
  phaseName: string;
  loadPercentage: number;
  restSeconds: number;
  durationWeeks: number;
  weeklyFrequency: number;
  selectedEquipments: string[];
  selectedPreWorkouts: string[];
  selectedPostWorkouts: string[];
  days: WorkoutDay[];
}

function PersonalizedWorkoutBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const [isPreConfigured, setIsPreConfigured] = useState(() => searchParams.get('preConfigured') === 'true');
  const [planName, setPlanName] = useState('');
  const [assignedAthleteIds, setAssignedAthleteIds] = useState<string[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  // Load currently logged in user profile (for the professor's name)
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Loading and Selections state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Firestore Libraries
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [rhythms, setRhythms] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [preWorkouts, setPreWorkouts] = useState<any[]>([]);
  const [postWorkouts, setPostWorkouts] = useState<any[]>([]);
  const [exercisesLibrary, setExercisesLibrary] = useState<any[]>([]);

  // Search/Filter terms for selectors
  const [athleteSearch, setAthleteSearch] = useState('');
  const [objectiveSearch, setObjectiveSearch] = useState('');
  const [methodSearch, setMethodSearch] = useState('');
  const [rhythmSearch, setRhythmSearch] = useState('');
  const [phaseSearch, setPhaseSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [preWorkoutSearch, setPreWorkoutSearch] = useState('');
  const [postWorkoutSearch, setPostWorkoutSearch] = useState('');

  // Dropdown open states
  const [showAthleteList, setShowAthleteList] = useState(false);

  // Form selections
  const [selectedAthlete, setSelectedAthlete] = useState<UserProfile | null>(null);
  const [selectedObjective, setSelectedObjective] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedRhythm, setSelectedRhythm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [loadPercentage, setLoadPercentage] = useState(50);
  const [restSeconds, setRestSeconds] = useState(60);
  const [durationFrequency, setDurationFrequency] = useState('4 semanas, 3x por semana');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [weeklyFrequency, setWeeklyFrequency] = useState(3);
  const [expirationDate, setExpirationDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  });

  // Checklists (Multi-select)
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedPreWorkouts, setSelectedPreWorkouts] = useState<string[]>([]);
  const [selectedPostWorkouts, setSelectedPostWorkouts] = useState<string[]>([]);

  // Exercise builder list
  const [workoutExercises, setWorkoutExercises] = useState<CustomExercise[]>([
    { id: 'ex-1', name: '', sets: 3, reps: '10', load: '', description: '', isTimeBased: false, durationMinutes: 1 }
  ]);

  // Periodic Tabs States
  const [tabs, setTabs] = useState<WorkoutTab[]>(() => {
    const sequence = [
      'A1', 'R1', 'R2', 'H1', 'R3', 'R4', 'H2', 'T1', 'R5', 'H3', 'R6', 'R7', 'H4', 'R8', 'R9', 'H5', 'R10'
    ];
    return sequence.map((name, idx) => ({
      name,
      isEnabled: idx === 0,
      objectiveName: '',
      methodName: '',
      rhythmName: '',
      phaseName: '',
      loadPercentage: 50,
      restSeconds: 60,
      durationWeeks: 4,
      weeklyFrequency: 3,
      selectedEquipments: [],
      selectedPreWorkouts: [],
      selectedPostWorkouts: [],
      days: [
        {
          name: 'Treino A',
          exercises: [{ id: 'ex-1', name: '', sets: 3, reps: '10', load: '', description: '', isTimeBased: false, durationMinutes: 1 }]
        }
      ]
    }));
  });
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [isTabDraggable, setIsTabDraggable] = useState(false);

  // Custom dialogs to handle sandbox-safe prompts and confirmations
  const [isAddPhaseOpen, setIsAddPhaseOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');

  const [isRenamePhaseOpen, setIsRenamePhaseOpen] = useState(false);
  const [renamePhaseIdx, setRenamePhaseIdx] = useState<number | null>(null);
  const [renamePhaseValue, setRenamePhaseValue] = useState('');

  const [isDeletePhaseOpen, setIsDeletePhaseOpen] = useState(false);
  const [deletePhaseIdx, setDeletePhaseIdx] = useState<number | null>(null);

  const [isDeleteDayOpen, setIsDeleteDayOpen] = useState(false);
  const [deleteDayIdx, setDeleteDayIdx] = useState<number | null>(null);

  const [isReorderPhaseOpen, setIsReorderPhaseOpen] = useState(false);
  const [reorderParams, setReorderParams] = useState<{ dragged: number; target: number } | null>(null);

  const saveActiveToTab = (tabIdx: number, dayIdx: number) => {
    setTabs(prev => {
      if (tabIdx < 0 || tabIdx >= prev.length) return prev;
      const newTabs = JSON.parse(JSON.stringify(prev));
      const activeTab = newTabs[tabIdx];
      activeTab.objectiveName = selectedObjective;
      activeTab.methodName = selectedMethod;
      activeTab.rhythmName = selectedRhythm;
      activeTab.phaseName = selectedPhase;
      activeTab.loadPercentage = Number(loadPercentage);
      activeTab.restSeconds = Number(restSeconds);
      activeTab.durationWeeks = Number(durationWeeks);
      activeTab.weeklyFrequency = Number(weeklyFrequency);
      activeTab.selectedEquipments = selectedEquipments;
      activeTab.selectedPreWorkouts = selectedPreWorkouts;
      activeTab.selectedPostWorkouts = selectedPostWorkouts;

      if (activeTab.days && activeTab.days[dayIdx]) {
        activeTab.days[dayIdx].exercises = workoutExercises;
      }
      return newTabs;
    });
  };

  const switchTabOrDay = (newTabIdx: number, newDayIdx: number) => {
    // 1. Save current active values into current active tab/day in list
    saveActiveToTab(activeTabIdx, activeDayIdx);

    // 2. Read new active values from target tab/day
    setTabs(prev => {
      const targetTab = prev[newTabIdx];
      if (targetTab) {
        setSelectedObjective(targetTab.objectiveName || '');
        setSelectedMethod(targetTab.methodName || '');
        setSelectedRhythm(targetTab.rhythmName || '');
        setSelectedPhase(targetTab.phaseName || '');
        setLoadPercentage(targetTab.loadPercentage ?? 50);
        setRestSeconds(targetTab.restSeconds ?? 60);
        setDurationWeeks(targetTab.durationWeeks ?? 4);
        setWeeklyFrequency(targetTab.weeklyFrequency ?? 3);
        setSelectedEquipments(targetTab.selectedEquipments || []);
        setSelectedPreWorkouts(targetTab.selectedPreWorkouts || []);
        setSelectedPostWorkouts(targetTab.selectedPostWorkouts || []);

        const targetDay = targetTab.days[newDayIdx];
        if (targetDay) {
          setWorkoutExercises(targetDay.exercises || []);
        } else {
          setWorkoutExercises([{ id: 'ex-1', name: '', sets: 3, reps: '10', load: '' }]);
        }
      }
      return prev;
    });

    // 3. Update active index states
    setActiveTabIdx(newTabIdx);
    setActiveDayIdx(newDayIdx);
  };

  const addTab = () => {
    setNewPhaseName('');
    setIsAddPhaseOpen(true);
  };

  const handleAddTabConfirm = () => {
    if (!newPhaseName || !newPhaseName.trim()) return;
    
    saveActiveToTab(activeTabIdx, activeDayIdx);

    const newTab: WorkoutTab = {
      name: newPhaseName.trim(),
      isEnabled: true,
      objectiveName: selectedObjective,
      methodName: selectedMethod,
      rhythmName: selectedRhythm,
      phaseName: selectedPhase,
      loadPercentage: Number(loadPercentage),
      restSeconds: Number(restSeconds),
      durationWeeks: Number(durationWeeks),
      weeklyFrequency: Number(weeklyFrequency),
      selectedEquipments: [...selectedEquipments],
      selectedPreWorkouts: [...selectedPreWorkouts],
      selectedPostWorkouts: [...selectedPostWorkouts],
      days: [
        {
          name: 'Treino A',
          exercises: [{ id: 'ex-1', name: '', sets: 3, reps: '10', load: '' }]
        }
      ]
    };

    setTabs(prev => {
      const nextTabs = [...prev, newTab];
      setTimeout(() => {
        switchTabOrDay(nextTabs.length - 1, 0);
      }, 50);
      return nextTabs;
    });

    setIsAddPhaseOpen(false);
  };

  const deleteTab = (index: number) => {
    if (tabs.length <= 1) return;
    setDeletePhaseIdx(index);
    setTimeout(() => {
      setIsDeletePhaseOpen(true);
    }, 150);
  };

  const handleDeleteTabConfirm = () => {
    if (deletePhaseIdx === null) return;
    const index = deletePhaseIdx;

    let targetTabIdx = activeTabIdx;
    if (activeTabIdx === index) {
      targetTabIdx = index === 0 ? 0 : index - 1;
    } else if (activeTabIdx > index) {
      targetTabIdx = activeTabIdx - 1;
    }

    setTabs(prev => {
      const nextTabs = prev.filter((_, idx) => idx !== index);
      setTimeout(() => {
        switchTabOrDay(targetTabIdx, 0);
      }, 50);
      return nextTabs;
    });

    setIsDeletePhaseOpen(false);
    setDeletePhaseIdx(null);
  };

  const renameTab = (index: number) => {
    setRenamePhaseIdx(index);
    setRenamePhaseValue(tabs[index]?.name || '');
    setTimeout(() => {
      setIsRenamePhaseOpen(true);
    }, 150);
  };

  const handleRenameTabConfirm = () => {
    if (renamePhaseIdx === null || !renamePhaseValue.trim()) return;

    setTabs(prev => {
      const nextTabs = [...prev];
      if (nextTabs[renamePhaseIdx]) {
        nextTabs[renamePhaseIdx].name = renamePhaseValue.trim();
      }
      return nextTabs;
    });

    setIsRenamePhaseOpen(false);
    setRenamePhaseIdx(null);
  };

  const toggleTabEnabled = (index: number) => {
    setTabs(prev => 
      prev.map((tab, idx) => 
        idx === index 
          ? { ...tab, isEnabled: tab.isEnabled !== false ? false : true } 
          : tab
      )
    );
  };

  const toggleDayEnabled = (dayIndex: number) => {
    setTabs(prev => 
      prev.map((tab, idx) => {
        if (idx === activeTabIdx) {
          const nextDays = tab.days.map((day, dIdx) => 
            dIdx === dayIndex 
              ? { ...day, isEnabled: day.isEnabled !== false ? false : true } 
              : day
          );
          return { ...tab, days: nextDays };
        }
        return tab;
      })
    );
  };

  const addWorkoutDayToActiveTab = () => {
    const currentTab = tabs[activeTabIdx];
    if (!currentTab) return;
    if (currentTab.days.length >= 4) {
      toast({
        variant: 'destructive',
        title: 'Limite atingido',
        description: 'Você pode adicionar no máximo 4 fichas (dias de treino) por aba.',
      });
      return;
    }

    const dayLetters = ['A', 'B', 'C', 'D'];
    const nextLetter = dayLetters[currentTab.days.length] || 'A';
    const newDayName = `Treino ${nextLetter}`;

    // Save current active day's exercises first
    const nextTabs = JSON.parse(JSON.stringify(tabs));
    const activeTab = nextTabs[activeTabIdx];
    if (activeTab) {
      activeTab.days[activeDayIdx].exercises = workoutExercises;
      activeTab.days.push({
        name: newDayName,
        exercises: [{ id: `ex-${Date.now()}`, name: '', sets: 3, reps: '10', load: '' }]
      });
    }

    setTabs(nextTabs);
    const targetIdx = currentTab.days.length; // is index of new day since it is appended
    setTimeout(() => {
      switchTabOrDay(activeTabIdx, targetIdx);
    }, 50);
  };

  const removeWorkoutDayFromActiveTab = (dayIndex: number) => {
    const currentTab = tabs[activeTabIdx];
    if (!currentTab || currentTab.days.length <= 1) return;
    setDeleteDayIdx(dayIndex);
    setIsDeleteDayOpen(true);
  };

  const handleDeleteDayConfirm = () => {
    if (deleteDayIdx === null) return;
    const currentTab = tabs[activeTabIdx];
    if (!currentTab) return;
    const dayIndex = deleteDayIdx;

    let targetDayIdx = activeDayIdx;
    if (activeDayIdx === dayIndex) {
      targetDayIdx = dayIndex === 0 ? 0 : dayIndex - 1;
    } else if (activeDayIdx > dayIndex) {
      targetDayIdx = activeDayIdx - 1;
    }

    const nextTabs = JSON.parse(JSON.stringify(tabs));
    const activeTab = nextTabs[activeTabIdx];
    if (activeTab) {
      activeTab.days = activeTab.days.filter((_: any, idx: number) => idx !== dayIndex);
      const dayLetters = ['A', 'B', 'C', 'D'];
      activeTab.days.forEach((day: any, idx: number) => {
        day.name = `Treino ${dayLetters[idx] || 'A'}`;
      });
    }

    setTabs(nextTabs);
    setTimeout(() => {
      switchTabOrDay(activeTabIdx, targetDayIdx);
    }, 50);

    setIsDeleteDayOpen(false);
    setDeleteDayIdx(null);
  };

  const [draggedTabIdx, setDraggedTabIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTabIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedTabIdx === null || draggedTabIdx === targetIndex) return;

    setReorderParams({ dragged: draggedTabIdx, target: targetIndex });
    setIsReorderPhaseOpen(true);
    setDraggedTabIdx(null);
  };

  const handleReorderConfirm = () => {
    if (!reorderParams) return;
    const { dragged, target } = reorderParams;

    // Save active state of current active tab first
    saveActiveToTab(activeTabIdx, activeDayIdx);

    setTabs(prev => {
      const nextTabs = [...prev];
      const [draggedItem] = nextTabs.splice(dragged, 1);
      nextTabs.splice(target, 0, draggedItem);

      // Determine new active index of currently viewed tab
      let newActiveIdx = activeTabIdx;
      if (activeTabIdx === dragged) {
        newActiveIdx = target;
      } else {
        const oldIdx = nextTabs.findIndex(t => t.name === prev[activeTabIdx].name);
        if (oldIdx !== -1) {
          newActiveIdx = oldIdx;
        }
      }

      setTimeout(() => {
        switchTabOrDay(newActiveIdx, 0);
      }, 50);

      return nextTabs;
    });

    setIsReorderPhaseOpen(false);
    setReorderParams(null);
  };

  // Load libraries from Firestore onSnapshot (realtime)
  useEffect(() => {
    if (!firestore) return;

    setLoading(true);

    const unsubscribes: (() => void)[] = [];

    // 1. Athletes
    const qAthletes = query(collection(firestore, 'userProfiles'), where('roleId', '==', Role.Athlete));
    unsubscribes.push(onSnapshot(qAthletes, (snapshot) => {
      setAthletes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserProfile));
    }));

    // 2. Objectives
    const qObjectives = query(collection(firestore, 'objectives'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qObjectives, (snapshot) => {
      setObjectives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 3. Methods
    const qMethods = query(collection(firestore, 'methods'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qMethods, (snapshot) => {
      setMethods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 4. Rhythms
    const qRhythms = query(collection(firestore, 'rhythms'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qRhythms, (snapshot) => {
      setRhythms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 5. Phases
    const qPhases = query(collection(firestore, 'trainingPhases'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qPhases, (snapshot) => {
      setPhases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 6. Equipments
    const qEquipments = query(collection(firestore, 'equipment'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qEquipments, (snapshot) => {
      setEquipments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 7. Pre workouts
    const qPre = query(collection(firestore, 'preWorkouts'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qPre, (snapshot) => {
      setPreWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 8. Post workouts
    const qPost = query(collection(firestore, 'postWorkouts'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qPost, (snapshot) => {
      setPostWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }));

    // 9. Exercises library
    const qEx = query(collection(firestore, 'exercises'), orderBy('name', 'asc'));
    unsubscribes.push(onSnapshot(qEx, (snapshot) => {
      setExercisesLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }));

  }, [firestore]);

  // Load existing plan data if editId is provided
  useEffect(() => {
    if (!firestore || !editId) return;

    const loadPlanData = async () => {
      try {
        const { getDoc, getDocs } = await import('firebase/firestore');
        const planDoc = await getDoc(doc(firestore, 'trainingPlans', editId));
        if (planDoc.exists()) {
          const planData = planDoc.data();
          
          setIsPreConfigured(planData.isPreConfigured === true);
          setPlanName(planData.name || '');
          setGender(planData.gender || 'male');
          setAssignedAthleteIds(planData.assignedToAthleteIds || []);
          
          // Reconstruct phases (tabs)
          let loadedPhases: any[] = planData.phases || [];
          if (loadedPhases.length === 0) {
            loadedPhases = [{
              name: 'A1',
              isEnabled: true,
              objectiveName: planData.objectiveName || '',
              methodName: planData.methodName || '',
              rhythmName: planData.rhythmName || '',
              phaseName: planData.phaseName || '',
              loadPercentage: planData.loadPercentage ?? 50,
              restSeconds: planData.restSeconds ?? 60,
              durationWeeks: planData.durationWeeks ?? 4,
              weeklyFrequency: planData.weeklyFrequency ?? 3,
              selectedEquipments: planData.selectedEquipments || [],
              selectedPreWorkouts: planData.selectedPreWorkouts || [],
              selectedPostWorkouts: planData.selectedPostWorkouts || []
            }];
          }

          // Fetch workout days subcollection
          const daysSnap = await getDocs(collection(firestore, 'trainingPlans', editId, 'workoutDays'));
          const rawDays = daysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const parsedTabs: WorkoutTab[] = loadedPhases.map((phase: any) => {
            const phaseDays = rawDays.filter((d: any) => {
              const pName = d.phaseName || 'A1';
              return pName.toLowerCase() === phase.name.toLowerCase();
            });

            // Sort days alphabetically or by custom naming
            phaseDays.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

            let mappedDays: WorkoutDay[] = phaseDays.map((d: any) => ({
              name: d.name || 'Treino A',
              exercises: (d.exercises || []).map((ex: any, idx: number) => ({
                id: ex.id || `ex-${idx}`,
                name: ex.exerciseName || ex.name || '',
                sets: ex.sets || 3,
                reps: ex.reps || '10',
                load: ex.carga || '',
                videoUrl: ex.videoUrl || ''
              }))
            }));

            if (mappedDays.length === 0) {
              mappedDays = [
                {
                  name: 'Treino A',
                  exercises: [{ id: 'ex-1', name: '', sets: 3, reps: '10', load: '' }]
                }
              ];
            }

            return {
              name: phase.name,
              isEnabled: phase.isEnabled !== false,
              objectiveName: phase.objectiveName || '',
              methodName: phase.methodName || '',
              rhythmName: phase.rhythmName || '',
              phaseName: phase.phaseName || '',
              loadPercentage: phase.loadPercentage ?? 50,
              restSeconds: phase.restSeconds ?? 60,
              durationWeeks: phase.durationWeeks ?? 4,
              weeklyFrequency: phase.weeklyFrequency ?? 3,
              selectedEquipments: phase.selectedEquipments || [],
              selectedPreWorkouts: phase.selectedPreWorkouts || [],
              selectedPostWorkouts: phase.selectedPostWorkouts || [],
              days: mappedDays
            };
          });

          setTabs(parsedTabs);
          setActiveTabIdx(0);
          setActiveDayIdx(0);

          if (parsedTabs.length > 0) {
            const firstTab = parsedTabs[0];
            setSelectedObjective(firstTab.objectiveName);
            setObjectiveSearch(firstTab.objectiveName);
            setSelectedMethod(firstTab.methodName);
            setMethodSearch(firstTab.methodName);
            setSelectedRhythm(firstTab.rhythmName);
            setRhythmSearch(firstTab.rhythmName);
            setSelectedPhase(firstTab.phaseName);
            setPhaseSearch(firstTab.phaseName);
            setLoadPercentage(firstTab.loadPercentage);
            setRestSeconds(firstTab.restSeconds);
            setDurationWeeks(firstTab.durationWeeks);
            setWeeklyFrequency(firstTab.weeklyFrequency);
            setSelectedEquipments(firstTab.selectedEquipments);
            setSelectedPreWorkouts(firstTab.selectedPreWorkouts);
            setSelectedPostWorkouts(firstTab.selectedPostWorkouts);
            
            if (firstTab.days.length > 0) {
              setWorkoutExercises(firstTab.days[0].exercises);
            }
          }
          setExpirationDate(planData.expirationDate || '');
        }
      } catch (error) {
        console.error('Error loading plan for edit:', error);
      }
    };

    loadPlanData();
  }, [firestore, editId]);

  // Handle athlete selection
  const selectAthlete = (athlete: UserProfile) => {
    setSelectedAthlete(athlete);
    setAthleteSearch(`${athlete.firstName} ${athlete.lastName || ''}`);
    setShowAthleteList(false);
    if (athlete.gender) {
      setGender(athlete.gender.toLowerCase() === 'female' ? 'female' : 'male');
    }
  };

  // Toggle multi-select items
  const toggleEquipment = (name: string) => {
    setSelectedEquipments(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const togglePreWorkout = (name: string) => {
    setSelectedPreWorkouts(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const togglePostWorkout = (name: string) => {
    setSelectedPostWorkouts(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  // Exercise builder actions
  const addExercise = () => {
    setWorkoutExercises([
      ...workoutExercises,
      { id: `ex-${Date.now()}`, name: '', sets: 3, reps: '10', load: '', description: '', isTimeBased: false, durationMinutes: 1 }
    ]);
  };

  const removeExercise = (index: number) => {
    if (workoutExercises.length === 1) return;
    setWorkoutExercises(workoutExercises.filter((_, idx) => idx !== index));
  };

  const updateExercise = (index: number, field: keyof CustomExercise, value: string | number) => {
    setWorkoutExercises(
      workoutExercises.map((ex, idx) => idx === index ? { ...ex, [field]: value } : ex)
    );
  };

  // Save personalized plan to Firestore
  const handleSavePlan = async () => {
    if (isPreConfigured) {
      if (!planName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Nome do Treino',
          description: 'Por favor, insira o nome do treino pré-configurado.',
        });
        return;
      }
    } else {
      if (!selectedAthlete) {
        toast({
          variant: 'destructive',
          title: 'Selecione um Aluno',
          description: 'É necessário vincular este plano a um aluno.',
        });
        return;
      }
    }

    if (!firestore || !user) return;

    setSaving(true);

    try {
      // 1. Build the final tabs list synchronously by saving current active form states
      const finalTabs = JSON.parse(JSON.stringify(tabs));
      const activeTab = finalTabs[activeTabIdx];
      if (activeTab) {
        activeTab.objectiveName = selectedObjective;
        activeTab.methodName = selectedMethod;
        activeTab.rhythmName = selectedRhythm;
        activeTab.phaseName = selectedPhase;
        activeTab.loadPercentage = Number(loadPercentage);
        activeTab.restSeconds = Number(restSeconds);
        activeTab.durationWeeks = Number(durationWeeks);
        activeTab.weeklyFrequency = Number(weeklyFrequency);
        activeTab.selectedEquipments = selectedEquipments;
        activeTab.selectedPreWorkouts = selectedPreWorkouts;
        activeTab.selectedPostWorkouts = selectedPostWorkouts;

        if (activeTab.days && activeTab.days[activeDayIdx]) {
          activeTab.days[activeDayIdx].exercises = workoutExercises;
        }
      }

      // 2. Validate all exercises in all tabs
      for (const tab of finalTabs) {
        for (const day of tab.days) {
          if (day.exercises.some(ex => !ex.name.trim())) {
            toast({
              variant: 'destructive',
              title: 'Exercício em branco',
              description: `Por favor, preencha o nome de todos os exercícios na aba "${tab.name}" -> "${day.name}".`,
            });
            setSaving(false);
            return;
          }
        }
      }

      const batch = writeBatch(firestore);
      const planRef = editId ? doc(firestore, 'trainingPlans', editId) : doc(collection(firestore, 'trainingPlans'));
      const athleteName = selectedAthlete ? `${selectedAthlete.firstName} ${selectedAthlete.lastName || ''}` : '';

      // 3. Serialize root parameters (using the first tab as default for backwards compatibility)
      const primaryTab = finalTabs[0] || activeTab || {
        objectiveName: selectedObjective,
        methodName: selectedMethod,
        rhythmName: selectedRhythm,
        phaseName: selectedPhase,
        loadPercentage: Number(loadPercentage),
        restSeconds: Number(restSeconds),
        durationWeeks: Number(durationWeeks),
        weeklyFrequency: Number(weeklyFrequency),
        selectedEquipments,
        selectedPreWorkouts,
        selectedPostWorkouts,
      };

      const planData: any = {
        name: isPreConfigured ? planName.trim() : `Plano Personalizado - ${athleteName}`,
        description: `Treino focado em ${primaryTab.objectiveName || 'Geral'}. Periodização: ${primaryTab.phaseName || 'Fase Geral'}. Método: ${primaryTab.methodName || 'Padrão'}.`,
        isPersonalized: !isPreConfigured,
        isPreConfigured: isPreConfigured,
        gender: gender,
        objectiveName: primaryTab.objectiveName,
        methodName: primaryTab.methodName,
        rhythmName: primaryTab.rhythmName,
        phaseName: primaryTab.phaseName,
        loadPercentage: Number(primaryTab.loadPercentage),
        restSeconds: Number(primaryTab.restSeconds),
        durationWeeks: Number(primaryTab.durationWeeks),
        weeklyFrequency: Number(primaryTab.weeklyFrequency),
        durationFrequency: `${primaryTab.durationWeeks} semanas, ${primaryTab.weeklyFrequency}x por semana`,
        expirationDate: expirationDate,
        selectedEquipments: primaryTab.selectedEquipments,
        selectedPreWorkouts: primaryTab.selectedPreWorkouts,
        selectedPostWorkouts: primaryTab.selectedPostWorkouts,
        updatedAt: serverTimestamp(),
        // Save full phases configuration list
        phases: finalTabs.map((t: any) => ({
          name: t.name,
          isEnabled: t.isEnabled !== false,
          objectiveName: t.objectiveName || '',
          methodName: t.methodName || '',
          rhythmName: t.rhythmName || '',
          phaseName: t.phaseName || '',
          loadPercentage: Number(t.loadPercentage),
          restSeconds: Number(t.restSeconds),
          durationWeeks: Number(t.durationWeeks),
          weeklyFrequency: Number(t.weeklyFrequency),
          selectedEquipments: t.selectedEquipments || [],
          selectedPreWorkouts: t.selectedPreWorkouts || [],
          selectedPostWorkouts: t.selectedPostWorkouts || []
        }))
      };

      if (isPreConfigured) {
        planData.athleteId = null;
        planData.athleteName = null;
        if (!editId) {
          planData.assignedToAthleteIds = [];
        }
      } else {
        planData.athleteId = selectedAthlete!.id;
        planData.athleteName = athleteName;
        planData.assignedToAthleteIds = [selectedAthlete!.id];
      }

      if (!editId) {
        planData.id = planRef.id;
        planData.createdAt = serverTimestamp();
        planData.createdByUserId = user.uid;
        planData.createdByUserName = userProfile?.firstName 
          ? `${userProfile.firstName} ${userProfile.lastName || ''}` 
          : user.email || 'Professor';
      }

      batch.set(planRef, planData, { merge: true });

      // 4. Clean up existing workout days if editing
      const targetPlanId = editId ? editId : planRef.id;
      if (editId) {
        const { getDocs } = await import('firebase/firestore');
        const daysSnap = await getDocs(collection(firestore, 'trainingPlans', editId, 'workoutDays'));
        for (const docSnap of daysSnap.docs) {
          batch.delete(docSnap.ref);
        }
      }

      // 5. Commit all workout days across all tabs
      for (const tab of finalTabs) {
        for (let dayIdx = 0; dayIdx < tab.days.length; dayIdx++) {
          const day = tab.days[dayIdx];
          const dayDocId = `${tab.name.replace(/\s+/g, '_')}_Day${dayIdx + 1}`.toLowerCase();
          const dayRef = doc(firestore, 'trainingPlans', targetPlanId, 'workoutDays', dayDocId);

          const dayData = {
            id: dayDocId,
            phaseName: tab.name,
            dayOrder: dayIdx + 1,
            name: day.name,
            isEnabled: day.isEnabled !== false,
            trainingPlanOwnerId: user.uid,
            trainingPlanAssignedToAthleteIds: isPreConfigured ? assignedAthleteIds : [selectedAthlete!.id],
            objectiveName: tab.objectiveName,
            methodName: tab.methodName,
            rhythmName: tab.rhythmName,
            loadPercentage: Number(tab.loadPercentage),
            restSeconds: Number(tab.restSeconds),
            durationWeeks: Number(tab.durationWeeks),
            weeklyFrequency: Number(tab.weeklyFrequency),
            selectedEquipments: tab.selectedEquipments,
            selectedPreWorkouts: tab.selectedPreWorkouts,
            selectedPostWorkouts: tab.selectedPostWorkouts,
            exercises: day.exercises.map((ex: any, idx: number) => ({
              id: ex.id || `exercise-${idx}`,
              exerciseName: ex.name,
              sets: Number(ex.sets),
              reps: ex.reps || '',
              carga: ex.load || '',
              videoUrl: ex.videoUrl || '',
              description: ex.description || '',
              isTimeBased: ex.isTimeBased === true,
              durationMinutes: Number(ex.durationMinutes || 1),
              isCompleted: false
            }))
          };

          batch.set(dayRef, dayData);
        }
      }

      // Commit transaction
      await batch.commit();

      toast({
        title: editId ? 'Plano Atualizado com Sucesso!' : 'Plano Salvo com Sucesso!',
        description: editId 
          ? 'O plano de treino foi atualizado.'
          : isPreConfigured
            ? 'O treino pré-configurado foi criado com sucesso.'
            : `O plano de treino personalizado foi atribuído a ${athleteName}.`,
      });

      // Redirect back to workouts list
      setTimeout(() => router.push('/dashboard/workouts'), 1500);

    } catch (error: any) {
      console.error('Error saving personalized plan:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar o plano de treino.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtered lists for inputs
  const filteredAthletes = athletes.filter(a => 
    `${a.firstName} ${a.lastName || ''}`.toLowerCase().includes(athleteSearch.toLowerCase())
  );

  const filteredObjectives = objectives.filter(o => 
    o.name?.toLowerCase().includes(objectiveSearch.toLowerCase())
  );

  const filteredMethods = methods.filter(m => 
    m.name?.toLowerCase().includes(methodSearch.toLowerCase())
  );

  const filteredRhythms = rhythms.filter(r => 
    r.name?.toLowerCase().includes(rhythmSearch.toLowerCase())
  );

  const filteredPhases = phases.filter(p => 
    p.name?.toLowerCase().includes(phaseSearch.toLowerCase())
  );

  const filteredEquipments = equipments.filter(eq => 
    eq.name?.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  const filteredPreWorkouts = preWorkouts.filter(pre => 
    pre.name?.toLowerCase().includes(preWorkoutSearch.toLowerCase())
  );

  const filteredPostWorkouts = postWorkouts.filter(pos => 
    pos.name?.toLowerCase().includes(postWorkoutSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Carregando bibliotecas e cadastros...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 md:p-8 space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/50 p-6 rounded-2xl border border-primary/10 backdrop-blur-sm sticky top-4 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10">
            <Link href="/dashboard/workouts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">
              {editId 
                ? (isPreConfigured ? 'Editar Treino Pré-Configurado' : 'Editar Plano Personalizado') 
                : (isPreConfigured ? 'Criar Treino Pré-Configurado' : 'Criar Plano Personalizado')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isPreConfigured 
                ? 'Monte modelos de treino reutilizáveis que podem ser vinculados a múltiplos alunos depois.' 
                : 'Monte treinos individuais vinculando objetivos, ritmos e métodos específicos.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSavePlan} disabled={saving} className="flex-1 sm:flex-none shadow-md shadow-primary/20">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Plano
          </Button>
        </div>
      </div>

      {/* Fases do Treino (Periodização) */}
      <Card className="border-primary/10 bg-card/45 backdrop-blur-sm relative z-20">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> Fases de Periodização (Abas)
            </h3>
            <p className="text-xs text-muted-foreground">Crie e configure as fases que o aluno irá progredir ao longo do tempo.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab, idx) => {
              const isActive = idx === activeTabIdx;
              return (
                <div 
                  key={idx} 
                  draggable={isTabDraggable}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, idx)}
                  className="flex items-center bg-background/35 rounded-xl border border-primary/5 p-1 gap-1 shadow-sm transition-all"
                >
                  <div
                    className="px-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/45 hover:text-foreground flex items-center justify-center"
                    onMouseDown={() => setIsTabDraggable(true)}
                    onMouseUp={() => setIsTabDraggable(false)}
                    onMouseLeave={() => setIsTabDraggable(false)}
                    title="Arraste para mudar a ordem das fases"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <Button
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    className={`h-8 px-2 rounded-lg flex items-center gap-1.5 ${
                      isActive ? "shadow-sm bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-primary/5"
                    }`}
                    onClick={() => switchTabOrDay(idx, 0)}
                  >
                    <span className={`w-2 h-2 rounded-full ${tab.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/35'}`} />
                    <span className="text-xs">{tab.name}</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-6 text-muted-foreground/75 hover:text-foreground"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border border-primary/10">
                      <DropdownMenuItem 
                        onSelect={() => toggleTabEnabled(idx)}
                        className="flex items-center gap-2 cursor-pointer text-xs font-semibold hover:bg-primary/5"
                      >
                        <Power className="w-3 h-3 text-muted-foreground" />
                        {tab.isEnabled ? 'Desabilitar Fase' : 'Habilitar Fase'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => renameTab(idx)}
                        className="flex items-center gap-2 cursor-pointer text-xs font-semibold hover:bg-primary/5"
                      >
                        <RefreshCw className="w-3 h-3 text-muted-foreground" />
                        Renomear Fase
                      </DropdownMenuItem>
                      {tabs.length > 1 && (
                        <DropdownMenuItem 
                          onSelect={() => deleteTab(idx)}
                          className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-red-500 hover:bg-red-500/10 focus:text-red-500 focus:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir Fase
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              onClick={addTab}
              className="h-9 border-dashed border-primary/30 hover:border-primary text-primary flex items-center gap-1.5 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Fase
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Configs */}
        <div className="lg:col-span-2 space-y-6">
          {isPreConfigured ? (
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative z-20">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  Identificação do Modelo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Nome do Treino Pré-Configurado</Label>
                  <Input 
                    id="plan-name"
                    placeholder="Ex: Treino de Hipertrofia Avançado"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="bg-background/50 border-primary/20 text-base font-semibold"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Este nome será exibido na listagem de modelos e para os alunos vinculados.</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-primary/5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gênero Alvo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                        gender === 'male'
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-500 font-bold shadow-sm'
                          : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      Homem
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                        gender === 'female'
                          ? 'bg-pink-500/10 border-pink-500/50 text-pink-500 font-bold shadow-sm'
                          : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      Mulher
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative focus-within:z-40 z-20">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                  <User className="h-4 w-4 text-primary" />
                  Vincular ao Aluno
                </CardTitle>
              </CardHeader>
              <CardContent className={`pt-4 relative ${showAthleteList ? 'z-50' : 'z-10'}`}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="athlete-search">Selecionar Aluno</Label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                      <Input 
                        id="athlete-search"
                        placeholder="Digite o nome do aluno..."
                        value={athleteSearch}
                        onChange={(e) => {
                          setAthleteSearch(e.target.value);
                          setShowAthleteList(true);
                          if (selectedAthlete) setSelectedAthlete(null);
                        }}
                        onFocus={() => setShowAthleteList(true)}
                        className="pl-9 bg-background/50 border-primary/20 text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* Athlete Dropdown */}
                  {showAthleteList && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setShowAthleteList(false)}
                      />
                      <Card className="absolute left-4 right-4 z-50 mt-1 max-h-56 overflow-y-auto shadow-2xl border-primary/10 bg-popover text-foreground">
                        <div className="p-2 space-y-1">
                          {filteredAthletes.map(athlete => (
                            <button
                              key={athlete.id}
                              onClick={() => selectAthlete(athlete)}
                              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-primary/15 hover:text-primary font-medium relative z-50"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                {athlete.firstName[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold">{`${athlete.firstName} ${athlete.lastName || ''}`}</p>
                                <p className="text-xs text-muted-foreground">{athlete.email}</p>
                              </div>
                            </button>
                          ))}
                          {filteredAthletes.length === 0 && (
                            <p className="text-xs text-center p-4 text-muted-foreground">Nenhum aluno encontrado.</p>
                          )}
                        </div>
                      </Card>
                    </>
                  )}

                  {selectedAthlete && (
                    <div className="mt-1 flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
                        {selectedAthlete.firstName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{`${selectedAthlete.firstName} ${selectedAthlete.lastName || ''}`}</p>
                        <p className="text-xs text-muted-foreground">{selectedAthlete.email}</p>
                      </div>
                      <Badge className="ml-auto bg-primary text-primary-foreground font-bold">Selecionado</Badge>
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-primary/5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gênero do Aluno/Ficha</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                          gender === 'male'
                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-500 font-bold shadow-sm'
                            : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        Homem
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-2 px-4 rounded-xl border text-sm font-bold transition-all ${
                          gender === 'female'
                            ? 'bg-pink-500/10 border-pink-500/50 text-pink-500 font-bold shadow-sm'
                            : 'border-primary/10 hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        Mulher
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Plan Configs */}
          <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative focus-within:z-40 z-10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                <Target className="h-4 w-4 text-primary" />
                Prescrição Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Status da Aba Ativa */}
              <div className="flex items-center justify-between p-3 bg-secondary/35 rounded-xl border border-border/40 mb-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-foreground">Aba {tabs[activeTabIdx]?.name} Ativa</Label>
                  <p className="text-[10px] text-muted-foreground">O aluno vê esta aba se habilitada.</p>
                </div>
                <Button
                  type="button"
                  variant={tabs[activeTabIdx]?.isEnabled ? "default" : "outline"}
                  onClick={() => {
                    setTabs(prev => {
                      const updated = [...prev];
                      if (updated[activeTabIdx]) {
                        updated[activeTabIdx].isEnabled = !updated[activeTabIdx].isEnabled;
                      }
                      return updated;
                    });
                  }}
                  className={`h-8 text-xs font-bold ${
                    tabs[activeTabIdx]?.isEnabled 
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-sm" 
                      : "text-muted-foreground hover:bg-primary/5"
                  }`}
                >
                  {tabs[activeTabIdx]?.isEnabled ? "Habilitada" : "Desabilitada"}
                </Button>
              </div>

              {/* Objectives */}
              <div className="space-y-1.5">
                <Label htmlFor="objective">Objetivo</Label>
                <div className="flex gap-2">
                  <SelectBox 
                    placeholder="Selecione o objetivo..."
                    value={selectedObjective}
                    onChange={setSelectedObjective}
                    items={filteredObjectives}
                    searchTerm={objectiveSearch}
                    setSearchTerm={setObjectiveSearch}
                    icon={Target}
                  />
                </div>
              </div>

              {/* Methods */}
              <div className="space-y-1.5">
                <Label htmlFor="method">Método</Label>
                <SelectBox 
                  placeholder="Selecione o método..."
                  value={selectedMethod}
                  onChange={setSelectedMethod}
                  items={filteredMethods}
                  searchTerm={methodSearch}
                  setSearchTerm={setMethodSearch}
                  icon={Zap}
                />
              </div>

              {/* Rhythms */}
              <div className="space-y-1.5">
                <Label htmlFor="rhythm">Ritmo / Cadência</Label>
                <SelectBox 
                  placeholder="Selecione o ritmo..."
                  value={selectedRhythm}
                  onChange={setSelectedRhythm}
                  items={filteredRhythms}
                  searchTerm={rhythmSearch}
                  setSearchTerm={setRhythmSearch}
                  icon={Activity}
                />
              </div>

              {/* Phase */}
              <div className="space-y-1.5">
                <Label htmlFor="phase">Fase do Treino</Label>
                <SelectBox 
                  placeholder="Selecione a fase..."
                  value={selectedPhase}
                  onChange={setSelectedPhase}
                  items={filteredPhases}
                  searchTerm={phaseSearch}
                  setSearchTerm={setPhaseSearch}
                  icon={TrendingUp}
                />
              </div>

              {/* Global Load & Rest */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="load-pct">Carga Geral (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="load-pct"
                      type="number"
                      min={1}
                      max={100}
                      value={loadPercentage}
                      onChange={(e) => setLoadPercentage(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      className="bg-background/50 border-primary/20 text-center font-bold text-base"
                    />
                    <span className="text-sm font-bold text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rest">Descanso Geral (s)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="rest"
                      type="number"
                      min={0}
                      value={restSeconds}
                      onChange={(e) => setRestSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-background/50 border-primary/20 text-center font-bold text-base"
                    />
                    <span className="text-sm font-bold text-muted-foreground">s</span>
                  </div>
                </div>
              </div>

              {/* Duration and Expiration */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="duration-weeks">Duração (Semanas)</Label>
                  <Input 
                    id="duration-weeks"
                    type="number"
                    min={1}
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-background/50 border-primary/20 text-base font-bold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekly-freq">Frequência Semanal</Label>
                  <Input 
                    id="weekly-freq"
                    type="number"
                    min={1}
                    max={7}
                    value={weeklyFrequency}
                    onChange={(e) => setWeeklyFrequency(Math.max(1, Math.min(7, parseInt(e.target.value) || 1)))}
                    className="bg-background/50 border-primary/20 text-base font-bold text-center"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Prazo de Vencimento</Label>
                <Input 
                  id="expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="bg-background/50 border-primary/20 text-base"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Exercises & Checklists */}
        <div className="lg:col-span-3 space-y-6">
          {/* Exercises Section */}
           <Card className="border-primary/10 bg-card/40 backdrop-blur-sm relative focus-within:z-40 z-20">
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-foreground font-headline">
                <Dumbbell className="h-4 w-4 text-primary animate-bounce" />
                Lista de Exercícios
              </CardTitle>
              <Button onClick={addExercise} variant="outline" size="sm" className="bg-primary/10 border-primary/25 hover:bg-primary/20 text-primary font-bold">
                <Plus className="h-4 w-4 mr-1.5" /> Adicionar Exercício
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Abas de Fichas Diárias (Treino A, B, C, D) */}
              <div className="flex items-center justify-between border-b pb-3 border-border/40 gap-4 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tabs[activeTabIdx]?.days.map((day, idx) => {
                    const isDayActive = idx === activeDayIdx;
                    return (
                      <div key={idx} className="flex items-center bg-secondary/35 rounded-lg border border-border/40 p-0.5 gap-0.5">
                        <Button
                          type="button"
                          variant={isDayActive ? "default" : "ghost"}
                          className={`h-7 px-2.5 rounded text-xs font-bold ${
                            isDayActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/5"
                          }`}
                          onClick={() => switchTabOrDay(activeTabIdx, idx)}
                        >
                          {day.name}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleDayEnabled(idx)}
                          className={`h-7 w-7 rounded ${
                            day.isEnabled !== false 
                              ? 'text-green-500 hover:text-green-600 hover:bg-green-500/10' 
                              : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted'
                          }`}
                          title={day.isEnabled !== false ? "Treino Ativo (Visível para o aluno)" : "Treino Desativado (Oculto para o aluno)"}
                        >
                          {day.isEnabled !== false ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        {tabs[activeTabIdx].days.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-6 text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => removeWorkoutDayFromActiveTab(idx)}
                            title="Remover Ficha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {tabs[activeTabIdx]?.days.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addWorkoutDayToActiveTab}
                      className="h-8 border-dashed border-primary/25 hover:border-primary text-primary flex items-center gap-1 text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Ficha (Treino)
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Aba ativa: <span className="font-bold text-foreground">{tabs[activeTabIdx]?.name}</span>
                </div>
              </div>

              {workoutExercises.map((ex, index) => (
                <div key={ex.id} className="p-4 bg-background/50 rounded-xl border border-primary/10 space-y-4 relative group transition-all duration-300 hover:border-primary/30 focus-within:z-30 z-10">
                  
                  {/* Row 1: Exercise Selection */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Exercício {index + 1}</Label>
                      <SelectBox 
                        placeholder="Selecione o exercício..."
                        value={ex.name}
                        onChange={(val) => {
                          updateExercise(index, 'name', val);
                          const matchingEx = exercisesLibrary.find(item => item.name === val);
                          if (matchingEx?.videoUrl) {
                            updateExercise(index, 'videoUrl', matchingEx.videoUrl);
                          }
                        }}
                        items={exercisesLibrary.filter(item => !ex.name || item.name.toLowerCase().includes(ex.name.toLowerCase()))}
                        searchTerm={ex.name}
                        setSearchTerm={(val) => updateExercise(index, 'name', val)}
                        icon={Dumbbell}
                      />
                    </div>
                    {workoutExercises.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeExercise(index)}
                        className="text-destructive hover:bg-destructive/15 h-10 w-10 border border-transparent hover:border-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Row 2: Metadata / Type Toggle, Video URL & Description */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground block">Tipo de Meta</Label>
                      <div className="flex gap-1 bg-muted/40 p-0.5 rounded-lg border border-primary/5">
                        <button
                          type="button"
                          onClick={() => updateExercise(index, 'isTimeBased', false)}
                          className={`flex-1 text-center py-1.5 text-xs rounded-md transition-all font-semibold ${
                            !ex.isTimeBased 
                              ? 'bg-background text-primary shadow-sm border border-primary/10' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Repetições
                        </button>
                        <button
                          type="button"
                          onClick={() => updateExercise(index, 'isTimeBased', true)}
                          className={`flex-1 text-center py-1.5 text-xs rounded-md transition-all font-semibold ${
                            ex.isTimeBased 
                              ? 'bg-background text-primary shadow-sm border border-primary/10' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Tempo (Cronômetro)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 col-span-1">
                      <Label className="text-xs text-muted-foreground">Demonstração em Vídeo</Label>
                      <Input 
                        value={ex.videoUrl || ''}
                        onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                        placeholder="Link do vídeo (opcional)"
                        className="bg-background/40 h-9 border-primary/10 text-xs"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <Label className="text-xs text-muted-foreground">Descrição / Orientação</Label>
                      <Input 
                        value={ex.description || ''}
                        onChange={(e) => updateExercise(index, 'description', e.target.value)}
                        placeholder="Ex: Execução lenta, foco na contração"
                        className="bg-background/40 h-9 border-primary/10 text-xs"
                      />
                    </div>
                  </div>

                  {/* Row 3: Target Metrics depending on isTimeBased */}
                  {!ex.isTimeBased ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Séries</Label>
                        <Input 
                          type="number"
                          min={1}
                          value={ex.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                          className="bg-background/40 h-9 text-center border-primary/10 text-sm font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Repetições</Label>
                        <Input 
                          value={ex.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          placeholder="Ex: 10 ou 12"
                          className="bg-background/40 h-9 border-primary/10 text-sm text-center font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Carga Inicial</Label>
                        <Input 
                          value={ex.load}
                          onChange={(e) => updateExercise(index, 'load', e.target.value)}
                          placeholder="Ex: 20kg / S/C"
                          className="bg-background/40 h-9 border-primary/10 text-sm text-center font-semibold text-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tempo (Minutos)</Label>
                        <Input 
                          type="number"
                          min={0.1}
                          step={0.1}
                          value={ex.durationMinutes || 1}
                          onChange={(e) => updateExercise(index, 'durationMinutes', parseFloat(e.target.value) || 1)}
                          className="bg-background/40 h-9 text-center border-primary/10 text-sm font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Séries (Repetições de Tempo)</Label>
                        <Input 
                          type="number"
                          min={1}
                          value={ex.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                          className="bg-background/40 h-9 text-center border-primary/10 text-sm font-semibold"
                        />
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </CardContent>
          </Card>

          {/* Checklists: Equipments, Pre/Post Workouts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Equipments */}
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
              <CardHeader className="py-3.5 border-b p-4">
                <CardTitle className="text-sm flex items-center gap-2 font-headline">
                  <Wrench className="h-4 w-4 text-primary" />
                  Equipamentos
                </CardTitle>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input 
                    placeholder="Filtrar..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/50 border-primary/15"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-44 pr-1">
                  <div className="space-y-1">
                    {filteredEquipments.map(item => {
                      const isChecked = selectedEquipments.includes(item.name);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleEquipment(item.name)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none border transition-colors ${
                            isChecked 
                              ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                              : 'border-transparent hover:bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span>{item.name}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pre Workouts */}
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
              <CardHeader className="py-3.5 border-b p-4">
                <CardTitle className="text-sm flex items-center gap-2 font-headline">
                  <Flame className="h-4 w-4 text-primary" />
                  Pré Treinos
                </CardTitle>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input 
                    placeholder="Filtrar..."
                    value={preWorkoutSearch}
                    onChange={(e) => setPreWorkoutSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/50 border-primary/15"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-44 pr-1">
                  <div className="space-y-1">
                    {filteredPreWorkouts.map(item => {
                      const isChecked = selectedPreWorkouts.includes(item.name);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => togglePreWorkout(item.name)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none border transition-colors ${
                            isChecked 
                              ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                              : 'border-transparent hover:bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span>{item.name}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Post Workouts */}
            <Card className="border-primary/10 bg-card/40 backdrop-blur-sm">
              <CardHeader className="py-3.5 border-b p-4">
                <CardTitle className="text-sm flex items-center gap-2 font-headline">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Pós Treinos
                </CardTitle>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input 
                    placeholder="Filtrar..."
                    value={postWorkoutSearch}
                    onChange={(e) => setPostWorkoutSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/50 border-primary/15"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-44 pr-1">
                  <div className="space-y-1">
                    {filteredPostWorkouts.map(item => {
                      const isChecked = selectedPostWorkouts.includes(item.name);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => togglePostWorkout(item.name)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none border transition-colors ${
                            isChecked 
                              ? 'bg-primary/10 border-primary/30 text-primary font-bold' 
                              : 'border-transparent hover:bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          <span>{item.name}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      {/* 1. Add Phase Modal */}
      <Dialog open={isAddPhaseOpen} onOpenChange={setIsAddPhaseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Fase de Periodização</DialogTitle>
            <DialogDescription>
              Digite o identificador da nova fase (Ex: A1, R2, H1).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newPhaseName} 
              onChange={(e) => setNewPhaseName(e.target.value)} 
              placeholder="Ex: R2"
              className="col-span-3 text-base font-bold bg-background/50"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPhaseOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddTabConfirm}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Rename Phase Modal */}
      <Dialog open={isRenamePhaseOpen} onOpenChange={setIsRenamePhaseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renomear Fase</DialogTitle>
            <DialogDescription>
              Altere o nome da fase selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={renamePhaseValue} 
              onChange={(e) => setRenamePhaseValue(e.target.value)} 
              className="col-span-3 text-base font-bold bg-background/50"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenamePhaseOpen(false)}>Cancelar</Button>
            <Button onClick={handleRenameTabConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Phase Modal */}
      <Dialog open={isDeletePhaseOpen} onOpenChange={setIsDeletePhaseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500">Excluir Fase?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja apagar esta fase? Esta ação excluirá todos os exercícios e dias salvos nela e não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeletePhaseOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTabConfirm}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Delete Day Modal */}
      <Dialog open={isDeleteDayOpen} onOpenChange={setIsDeleteDayOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500">Remover Ficha de Treino?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta ficha diária? Todos os exercícios vinculados a este dia nesta fase serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDayOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteDayConfirm}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Reorder Phase Modal */}
      <Dialog open={isReorderPhaseOpen} onOpenChange={setIsReorderPhaseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Ordem das Fases?</DialogTitle>
            <DialogDescription>
              Confirmar alteração na ordem das fases de periodização do treino?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setIsReorderPhaseOpen(false); setReorderParams(null); }}>Cancelar</Button>
            <Button onClick={handleReorderConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Searchable Custom SelectBox Component
interface SelectBoxProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  items: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  icon: React.ComponentType<any>;
}

function SelectBox({ placeholder, value, onChange, items, searchTerm, setSearchTerm, icon: Icon }: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`}>
      <div className="relative">
        <Icon className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        <Input
          placeholder={placeholder}
          value={value || searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (value) onChange('');
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 bg-background/50 border-primary/20 w-full text-base font-semibold"
        />
      </div>

      {isOpen && (
        <Card className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto shadow-2xl border-primary/10 bg-popover text-foreground">
          <div className="p-1.5 space-y-0.5">
            {/* Custom entry if not in list */}
            {searchTerm.trim() && !items.some(item => item.name.toLowerCase() === searchTerm.toLowerCase()) && (
              <button
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/15 text-primary font-bold flex items-center justify-between"
              >
                <span>Usar: "{searchTerm}"</span>
                <Plus className="h-4 w-4" />
              </button>
            )}

            {items.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.name);
                  setSearchTerm(item.name);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-primary/10 hover:text-primary font-semibold block"
              >
                {item.name}
              </button>
            ))}
            {items.length === 0 && !searchTerm.trim() && (
              <p className="text-xs text-center py-4 text-muted-foreground">Nenhum item cadastrado.</p>
            )}
          </div>
        </Card>
      )}

      {/* Backdrop overlay to close the list when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default function PersonalizedWorkoutBuilder() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Carregando formulário...</p>
      </div>
    }>
      <PersonalizedWorkoutBuilderInner />
    </Suspense>
  );
}
