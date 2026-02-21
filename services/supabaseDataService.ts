import { supabase } from '../lib/supabase';
import type { GlucoseLog, MealLog, ExerciseLog, GlucoseTiming, MealType } from '../types';

const toDbGlucose = (log: GlucoseLog, userId: string) => ({
  id: log.id,
  user_id: userId,
  value: log.value,
  unit: log.unit,
  timing: log.timing,
  meal_type: log.mealType ?? null,
  associated_meal_id: log.associatedMealId ?? null,
  timestamp: new Date(log.timestamp).toISOString(),
});

const fromDbGlucose = (row: any): GlucoseLog => ({
  id: row.id,
  value: parseFloat(row.value),
  unit: row.unit,
  timing: row.timing as GlucoseTiming,
  mealType: row.meal_type ?? undefined,
  associatedMealId: row.associated_meal_id ?? undefined,
  timestamp: new Date(row.timestamp),
});

const toDbMeal = (log: MealLog, userId: string) => ({
  id: log.id,
  user_id: userId,
  type: log.type,
  description: log.description,
  items: log.items ?? null,
  photo_url: log.photoUrl ?? null,
  nutrients: log.nutrients ?? null,
  timestamp: new Date(log.timestamp).toISOString(),
});

const fromDbMeal = (row: any): MealLog => ({
  id: row.id,
  type: row.type as MealType,
  description: row.description,
  items: row.items ?? undefined,
  photoUrl: row.photo_url ?? undefined,
  nutrients: row.nutrients ?? undefined,
  timestamp: new Date(row.timestamp),
});

const toDbExercise = (log: ExerciseLog, userId: string) => ({
  id: log.id,
  user_id: userId,
  activity: log.activity,
  duration: log.duration,
  intensity: log.intensity,
  timestamp: new Date(log.timestamp).toISOString(),
});

const fromDbExercise = (row: any): ExerciseLog => ({
  id: row.id,
  activity: row.activity,
  duration: row.duration,
  intensity: row.intensity as '低' | '中' | '高',
  timestamp: new Date(row.timestamp),
});

export async function fetchGlucoseLogs(userId: string): Promise<GlucoseLog[]> {
  const { data, error } = await supabase
    .from('glucose_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromDbGlucose);
}

export async function fetchMealLogs(userId: string): Promise<MealLog[]> {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromDbMeal);
}

export async function fetchExerciseLogs(userId: string): Promise<ExerciseLog[]> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromDbExercise);
}

export async function upsertGlucoseLog(log: GlucoseLog, userId: string): Promise<void> {
  const { error } = await supabase
    .from('glucose_logs')
    .upsert(toDbGlucose(log, userId), { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertMealLog(log: MealLog, userId: string): Promise<void> {
  const { error } = await supabase
    .from('meal_logs')
    .upsert(toDbMeal(log, userId), { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertExerciseLog(log: ExerciseLog, userId: string): Promise<void> {
  const { error } = await supabase
    .from('exercise_logs')
    .upsert(toDbExercise(log, userId), { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteGlucoseLog(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('glucose_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteMealLog(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}
