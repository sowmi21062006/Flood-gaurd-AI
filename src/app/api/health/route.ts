import { adminDb } from '@/lib/firebase/admin';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Just a simple read to check if firestore is connected
    await adminDb.collection('users').limit(1).get();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
