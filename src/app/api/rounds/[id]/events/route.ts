import { actor, handle, roundId } from '@/lib/api';
import { snapshot } from '@/lib/rounds';
import { listen } from '@/lib/live';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const id = roundId.parse((await ctx.params).id),
      who = await actor();
    await snapshot(id, who);
    const events = await listen();
    let cleanup = () => {};
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let closed = false,
          sending = false,
          again = false;
        const send = async () => {
          if (closed) return;
          if (sending) {
            again = true;
            return;
          }
          sending = true;
          try {
            const round = await snapshot(id, who);
            if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(round)}\n\n`));
          } catch {
            if (!closed) {
              cleanup();
              controller.close();
            }
          } finally {
            sending = false;
            if (again) {
              again = false;
              void send();
            }
          }
        };
        const update = () => {
          void send();
        };
        const timer = setInterval(update, 15000); // Recovery and heartbeat, even after a LISTEN connection loss.
        const timeout = setTimeout(() => {
          cleanup();
          controller.close();
        }, 240000);
        cleanup = () => {
          if (closed) return;
          closed = true;
          clearInterval(timer);
          clearTimeout(timeout);
          events.off(id, update);
          request.signal.removeEventListener('abort', abort);
        };
        const abort = () => {
          cleanup();
          try {
            controller.close();
          } catch {}
        };
        request.signal.addEventListener('abort', abort);
        events.on(id, update);
        if (request.signal.aborted) abort();
        else void send();
      },
      cancel() {
        cleanup();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  });
}
