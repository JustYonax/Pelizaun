// app/addons/page.tsx
'use client';

import { useAddons } from '@/lib/hooks/useAddons';
import { AddonCard } from '@/components/addons/AddonCard';
import { AddonForm } from '@/components/addons/AddonForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddonsPage() {
  const { addons, loading, error, installAddon, removeAddon, toggleAddon } = useAddons();

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mis Addons</h1>
        <AddonForm onInstall={installAddon} isLoading={loading} />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {addons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tienes addons instalados.</p>
          <p className="text-muted-foreground">¡Agrega uno para empezar!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {addons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              onToggle={toggleAddon}
              onRemove={removeAddon}
            />
          ))}
        </div>
      )}
    </div>
  );
}