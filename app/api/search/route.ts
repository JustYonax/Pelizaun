// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addonService } from '@/lib/services/addonService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'movie';

  if (!query) {
    return NextResponse.json({ error: 'Falta el parámetro de búsqueda' }, { status: 400 });
  }

  // 1. Obtener addons activos que provean 'stream'
  const addons = addonService.getAddons();
  const activeStreamAddons = addons.filter(a => 
    a.isActive && a.manifest.resources.includes('stream')
  );

  // 2. Para cada addon, intentar obtener streams
  for (const addon of activeStreamAddons) {
    try {
      // Construir la URL del endpoint de streams del addon
      const baseUrl = addon.url.replace('/manifest.json', '');
      // Asumimos que el addon soporta búsqueda por IMDb ID, necesitamos obtener el ID
      // Esto es un ejemplo, deberías adaptarlo a cómo obtienes el ID de la película
      const imdbId = await getImdbIdFromQuery(query); // Función que debes implementar
      
      if (!imdbId) continue;
      
      const streamUrl = `${baseUrl}/stream/${type}/${imdbId}.json`;
      const response = await fetch(streamUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.streams && data.streams.length > 0) {
          // 3. Si el addon devuelve streams, los retornamos inmediatamente
          return NextResponse.json({ 
            success: true, 
            source: addon.manifest.name,
            streams: data.streams 
          });
        }
      }
    } catch (error) {
      console.error(`Error con addon ${addon.manifest.name}:`, error);
      // Continuar con el siguiente addon
    }
  }

  // 4. Si ningún addon devuelve resultados
  return NextResponse.json({ 
    success: false, 
    message: 'No se encontraron streams para este contenido' 
  }, { status: 404 });
}