export async function GET() {
  try {
    const url = 'https://game.codycross-game.com/Texto/List?androidLang=en&deviceType=Android&appVersion=2.9.0';
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ Ok: false, Status: -1, Message: error.message, Records: [] });
  }
}
