'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, CreditCard, Calendar } from 'lucide-react';
import CountryFlag from './CountryFlag';

const bannerSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  imageUrl: z.string().url('Debe ser una URL válida'),
  targetUrl: z.string().url('Debe ser una URL válida'),
  position: z.enum(['top', 'sidebar', 'bottom']),
  gameCategory: z.string().min(1, 'Selecciona una categoría'),
  duration: z.enum(['7', '15', '30']),
});

type BannerForm = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const gameCategories = [
  { value: 'lineage-ii', label: 'Lineage II', flag: 'International' },
  { value: 'aion', label: 'Aion Online', flag: 'International' },
  { value: 'mu-online', label: 'Mu Online', flag: 'International' },
  { value: 'perfect-world', label: 'Perfect World', flag: 'International' },
  { value: 'counter-strike', label: 'Counter Strike', flag: 'International' },
  { value: 'wow', label: 'World of Warcraft', flag: 'International' },
  { value: 'all', label: 'Todas las categorías', flag: 'International' },
];

const positions = [
  { value: 'top', label: 'Banner Superior', cost: 200 },
  { value: 'sidebar', label: 'Banner Lateral', cost: 150 },
  { value: 'bottom', label: 'Banner Inferior', cost: 100 },
];

const durations = [
  { value: '7', label: '7 días', multiplier: 1 },
  { value: '15', label: '15 días', multiplier: 1.8 },
  { value: '30', label: '30 días', multiplier: 3 },
];

export default function BannerForm({ isOpen, onClose, onSuccess }: BannerFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      position: 'sidebar',
      gameCategory: 'all',
      duration: '15',
    },
  });

  const watchedValues = form.watch();
  const selectedPosition = positions.find(p => p.value === watchedValues.position);
  const selectedDuration = durations.find(d => d.value === watchedValues.duration);
  const totalCost = selectedPosition && selectedDuration 
    ? Math.round(selectedPosition.cost * selectedDuration.multiplier)
    : 0;

  const handleImageUrlChange = (url: string) => {
    setPreviewImage(url);
    form.setValue('imageUrl', url);
  };

  const handleSubmit = async (data: BannerForm) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(data.duration));

      const { error: insertError } = await supabase
        .from('banners')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          image_url: data.imageUrl,
          target_url: data.targetUrl,
          position: data.position,
          game_category: data.gameCategory,
          credits_cost: totalCost,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Deduct credits from user profile
      const { error: updateError } = await supabase.rpc('deduct_credits', {
        user_id: user.id,
        amount: totalCost,
      });

      if (updateError) throw updateError;

      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Error al crear el banner');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Crear Banner Publicitario</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-slate-300">Título del Banner</Label>
              <Input
                id="title"
                placeholder="Ej: ¡Únete a nuestro servidor!"
                className="bg-slate-800 border-slate-600 text-white"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-300">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descripción adicional del banner..."
                className="bg-slate-800 border-slate-600 text-white"
                {...form.register('description')}
              />
            </div>

            <div>
              <Label htmlFor="imageUrl" className="text-slate-300">URL de la Imagen</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                className="bg-slate-800 border-slate-600 text-white"
                {...form.register('imageUrl')}
                onChange={(e) => handleImageUrlChange(e.target.value)}
              />
              {form.formState.errors.imageUrl && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.imageUrl.message}</p>
              )}
              
              {previewImage && (
                <div className="mt-2">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full max-w-md h-32 object-cover rounded-lg border border-slate-600"
                    onError={() => setPreviewImage('')}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="targetUrl" className="text-slate-300">URL de Destino</Label>
              <Input
                id="targetUrl"
                type="url"
                placeholder="https://tu-servidor.com"
                className="bg-slate-800 border-slate-600 text-white"
                {...form.register('targetUrl')}
              />
              {form.formState.errors.targetUrl && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.targetUrl.message}</p>
              )}
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Posición del Banner</Label>
              <Select value={watchedValues.position} onValueChange={(value) => form.setValue('position', value as any)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value} className="text-white">
                      {position.label} - {position.cost} créditos/día
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Categoría del Juego</Label>
              <Select value={watchedValues.gameCategory} onValueChange={(value) => form.setValue('gameCategory', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {gameCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="text-white">
                      <div className="flex items-center space-x-2">
                        <CountryFlag country={category.flag} size="sm" />
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Duración</Label>
            <Select value={watchedValues.duration} onValueChange={(value) => form.setValue('duration', value as any)}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value} className="text-white">
                    {duration.label} (x{duration.multiplier} multiplicador)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Summary */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Resumen de Costos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Posición: {selectedPosition?.label}</span>
                <span>{selectedPosition?.cost} créditos/día</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Duración: {selectedDuration?.label}</span>
                <span>x{selectedDuration?.multiplier} multiplicador</span>
              </div>
              <div className="border-t border-slate-600 pt-2">
                <div className="flex justify-between text-white font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-cyan-400">{totalCost} créditos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="bg-red-900/20 border-red-500/50">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Crear Banner ({totalCost} créditos)
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}