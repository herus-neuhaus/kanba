import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSpaces } from '@/hooks/useSpaces';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const spaceSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  color: z.string().optional(),
});

type SpaceFormValues = z.infer<typeof spaceSchema>;

interface CreateSpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  { name: 'Slate', value: '#64748b', class: 'bg-slate-500' },
  { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Green', value: '#22c55e', class: 'bg-green-500' },
  { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
  { name: 'Violet', value: '#8b5cf6', class: 'bg-violet-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
];

export function CreateSpaceModal({ open, onOpenChange }: CreateSpaceModalProps) {
  const { createSpace } = useSpaces();
  const { toast } = useToast();

  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
      color: '#64748b',
    },
  });

  const onSubmit = async (values: SpaceFormValues) => {
    try {
      await createSpace.mutateAsync(values as { name: string; color?: string });
      toast({ title: 'Espaço criado com sucesso!' });
      form.reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao criar espaço',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Criar Novo Espaço</DialogTitle>
          <DialogDescription>
            Ambientes de trabalho organizados por clientes, setores ou times.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome do Espaço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cliente XPTO, Marketing, RH..." className="font-bold h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Cor do Ícone</FormLabel>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => field.onChange(color.value)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all flex items-center justify-center hover:scale-110",
                          color.class,
                          field.value === color.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-80"
                        )}
                      >
                        {field.value === color.value && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-bold uppercase text-[10px] tracking-widest">
                Cancelar
              </Button>
              <Button type="submit" disabled={createSpace.isPending} className="font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-primary/20">
                {createSpace.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Criar Espaço
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
