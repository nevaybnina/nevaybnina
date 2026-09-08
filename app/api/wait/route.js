import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Секретный ключ живёт только здесь, на сервере. В браузер он никогда не попадает,
// потому что этот файл выполняется на стороне Vercel, а не в коде страницы.
// Клиент создаём лениво (внутри запроса), а не при загрузке модуля — так сборка
// проекта не падает, даже если переменные окружения ещё не подключены.
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export const dynamic = 'force-dynamic';

// GET /api/wait?slug=markswebb-2026 — вернуть текущее число ожидающих
export async function GET(request) {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'slug обязателен' }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from('wait_counters')
    .select('count')
    .eq('event_slug', slug)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data?.count ?? 0 });
}

// POST /api/wait { slug: 'markswebb-2026' } — атомарно увеличить счётчик на 1
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const slug = body.slug;
  if (!slug) {
    return NextResponse.json({ error: 'slug обязателен' }, { status: 400 });
  }

  const { data, error } = await getSupabase().rpc('increment_wait_counter', { slug });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data });
}
