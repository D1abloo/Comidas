type Props = {
  available: boolean;
  size?: 'sm' | 'md';
};

export default function AvailabilityBadge({ available, size = 'sm' }: Props) {
  const sizeClass = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-full whitespace-nowrap ${sizeClass} ${
        available ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${available ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {available ? 'Disponible' : 'No disponible'}
    </span>
  );
}
