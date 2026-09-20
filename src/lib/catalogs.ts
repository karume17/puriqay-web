// Catálogos compartidos entre Locations.tsx y Jornadas.tsx.

// Distritos de Lima Metropolitana (43) y de la Provincia Constitucional del Callao (7).
export const DISTRITOS_LIMA = [
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos',
  'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina',
  'La Victoria', 'Lima (Cercado)', 'Lince', 'Los Olivos', 'Lurigancho (Chosica)', 'Lurín',
  'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre',
  'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja',
  'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
  'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
  'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
  'Villa María del Triunfo',
] as const;

export const DISTRITOS_CALLAO = [
  'Bellavista', 'Callao', 'Carmen de La Legua Reynoso', 'La Perla', 'La Punta',
  'Mi Perú', 'Ventanilla',
] as const;

// Líneas de acción de los lugares aliados. Una jornada hereda la línea del lugar
// donde se realiza, por eso no se elige aparte al programarla.
export const ACTION_LINES = ['Animalista', 'Ambiental', 'Social', 'Educativo', 'Salud'] as const;

export const getActionLineColor = (line: string) => {
  switch (line) {
    case 'Animalista': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Ambiental': return 'bg-green-100 text-green-700 border-green-200';
    case 'Social': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Educativo': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Salud': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-pq-cream text-pq-teal-dark border-pq-cream-dark';
  }
};
