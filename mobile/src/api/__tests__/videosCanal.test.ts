import { VIDEOS_RESERVA, buscarVideosCanal, dataCurta, lerFeed } from "../videosCanal";

const FEED = `<feed><title>Terra Gentil</title><published>2026-09-28T18:29:31+00:00</published>
<entry><yt:videoId>AAA</yt:videoId><title>Jardim &amp; vizinha: limpei de GRAÇA</title>
<link rel="alternate" href="https://www.youtube.com/shorts/AAA"/><published>2026-11-16T10:00:00+00:00</published></entry>
<entry><yt:videoId>BBB</yt:videoId><title>Video longo</title>
<link rel="alternate" href="https://www.youtube.com/watch?v=BBB"/><published>2026-11-14T12:00:10+00:00</published></entry>
</feed>`;

describe("videos do canal", () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it("le o feed na ordem, separa short e decodifica o titulo", () => {
    const v = lerFeed(FEED);
    expect(v.map((x) => [x.id, x.short, x.data])).toEqual([
      ["AAA", true, "16 nov 2026"],
      ["BBB", false, "14 nov 2026"],
    ]);
    expect(v[0].titulo).toBe("Jardim & vizinha: limpei de GRAÇA");
    expect(v[0].url).toBe("https://www.youtube.com/shorts/AAA");
    expect(v[1].url).toBe("https://www.youtube.com/watch?v=BBB");
    expect(v[1].thumb).toBe("https://i.ytimg.com/vi/BBB/hqdefault.jpg");
    expect(dataCurta("x")).toBe("");
  });

  it("sem internet usa a lista de reserva", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("offline");
    }) as any;
    expect(await buscarVideosCanal()).toBe(VIDEOS_RESERVA);
  });
});
