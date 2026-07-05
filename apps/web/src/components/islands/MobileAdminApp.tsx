import { useState } from 'react';
import MobileAppShell from './MobileAppShell';
import MobileOrdersPanel from './MobileOrdersPanel';
import CourierLivePanel from './CourierLivePanel';
import AdminAlerts from './AdminAlerts';

const TABS = [
  { id: 'pedidos', label: 'Pedidos', icon: '📋' },
  { id: 'mapa', label: 'Mapa', icon: '📍' },
];

export default function MobileAdminApp({ userName }: { userName: string }) {
  const [tab, setTab] = useState('pedidos');

  return (
    <MobileAppShell role="admin" userName={userName} tabs={TABS} activeTab={tab} onTabChange={setTab}>
      <AdminAlerts />
      {tab === 'pedidos' && <MobileOrdersPanel />}
      {tab === 'mapa' && (
        <div className="mobile-map-tab">
          <CourierLivePanel />
        </div>
      )}
    </MobileAppShell>
  );
}
