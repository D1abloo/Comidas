import MobileAppShell from './MobileAppShell';
import CourierBoard from './CourierBoard';

export default function MobileCourierApp({ courierName }: { courierName: string }) {
  return (
    <MobileAppShell role="courier" userName={courierName}>
      <CourierBoard courierName={courierName} embedded />
    </MobileAppShell>
  );
}
