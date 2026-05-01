export function NextResponse() {}
NextResponse.json = (data: unknown, init?: ResponseInit) => new Response(JSON.stringify(data), init);
