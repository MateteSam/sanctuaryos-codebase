import { redirect } from 'next/navigation';

// Legacy redirect — the Live Control is now at /app
export default function LivePage() {
  redirect('/app');
}
