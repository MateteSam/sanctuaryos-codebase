import MonitorClient from './MonitorClient';

export default async function MonitorPage({ params }: { params: Promise<{ busId: string }> }) {
  const { busId } = await params;
  return (
    <main style={{ minHeight: '100vh', background: '#0d0d11' }}>
      <MonitorClient busId={busId} />
    </main>
  );
}
