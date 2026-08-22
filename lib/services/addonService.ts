// lib/services/addonService.ts
import { InstalledAddon, Manifest } from '../types';

const STORAGE_KEY = 'pelizaun_addons';

export const addonService = {
  // Obtener todos los addons instalados
  getAddons(): InstalledAddon[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Guardar la lista de addons
  saveAddons(addons: InstalledAddon[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addons));
  },

  // Instalar un nuevo addon desde una URL
  async installAddon(manifestUrl: string): Promise<InstalledAddon> {
    // 1. Validar URL
    new URL(manifestUrl); // Lanza error si es inválida

    // 2. Fetch del manifiesto
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error('No se pudo obtener el manifiesto');
    const manifest: Manifest = await response.json();

    // 3. Validación básica del manifiesto
    if (!manifest.id || !manifest.name || !manifest.resources) {
      throw new Error('El manifiesto no es válido (formato Stremio)');
    }

    // 4. Verificar duplicados
    const existing = this.getAddons();
    if (existing.some(a => a.manifest.id === manifest.id)) {
      throw new Error('Este addon ya está instalado');
    }

    // 5. Guardar
    const newAddon: InstalledAddon = {
      id: manifest.id,
      manifest,
      url: manifestUrl,
      isActive: true,
      installedAt: new Date().toISOString(),
    };
    this.saveAddons([...existing, newAddon]);
    return newAddon;
  },

  // Desinstalar un addon
  removeAddon(addonId: string): void {
    const addons = this.getAddons().filter(a => a.id !== addonId);
    this.saveAddons(addons);
  },

  // Cambiar estado activo/inactivo
  toggleAddon(addonId: string): void {
    const addons = this.getAddons();
    const index = addons.findIndex(a => a.id === addonId);
    if (index !== -1) {
      addons[index].isActive = !addons[index].isActive;
      this.saveAddons(addons);
    }
  },
};