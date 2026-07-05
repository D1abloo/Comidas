import { CourierLocationMap } from './CourierLocationMap';

export function OrderCourierLocation({
  lat,
  lng,
  locationAt,
  courierName,
}: {
  lat: number;
  lng: number;
  locationAt?: string | null;
  courierName?: string | null;
}) {
  return (
    <div className="rounded-xl border border-bocado-line bg-bocado-paper/30 p-3">
      <p className="label mb-2">Ubicación del repartidor {courierName ? `· ${courierName}` : ''}</p>
      <CourierLocationMap lat={lat} lng={lng} updatedAt={locationAt} />
    </div>
  );
}
