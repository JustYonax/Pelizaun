// components/addons/AddonForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface AddonFormProps {
  onInstall: (url: string) => Promise<void>;
  isLoading: boolean;
}

export function AddonForm({ onInstall, isLoading }: AddonFormProps) {
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onInstall(url);
      setUrl('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al instalar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Addon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Instalar Nuevo Addon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            placeholder="https://ejemplo.com/manifest.json"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <Button type="submit" className="mt-4" disabled={isLoading}>
            {isLoading ? 'Instalando...' : 'Instalar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}