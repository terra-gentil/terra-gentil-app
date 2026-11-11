// GERADO a partir do site (terra-gentil/data/guias e lib/temas.ts). Nao editar na mao:
// rodar de novo o gerador quando o site ganhar livros novos.

export interface TemaColecao {
  id: string;
  nome: string;
  emoji: string;
  chamada: string;
  cor: string;
}

export interface LivroColecao {
  codigo: string;
  slug: string;
  titulo: string;
  pdf: string;
  tema: string;
}

export const COLECAO_PDF_BASE = "https://terra-gentil-pdfs.canalterragentil.workers.dev";
export const COLECAO_SITE_BASE = "https://terragentil.com.br";

export const TEMAS_COLECAO: TemaColecao[] = [
  { id: "orquideas", nome: "Orquídeas", emoji: "🌸", chamada: "Fazer florir de novo, tratar, replantar e conhecer as espécies.", cor: "#C75B9B" },
  { id: "suculentas", nome: "Suculentas, cactos e rosa-do-deserto", emoji: "🌵", chamada: "Pouca água, muito sol e mudas que viram coleção.", cor: "#3FA77A" },
  { id: "rosas", nome: "Roseiras", emoji: "🌹", chamada: "Rosa no vaso, poda, doença e muda de estaca.", cor: "#D8552B" },
  { id: "horta", nome: "Horta em casa", emoji: "🥬", chamada: "Da semente ao prato, no vaso, na varanda ou no canteiro.", cor: "#4A8C4F" },
  { id: "dentro-de-casa", nome: "Plantas dentro de casa", emoji: "🪴", chamada: "Folhagens e flores para pouca luz, com bicho em casa.", cor: "#E8A33D" },
  { id: "jardim", nome: "Jardim e quintal", emoji: "🏡", chamada: "Começar do zero, chamar abelha e passarinho, árvore e flor.", cor: "#2F7FA5" },
  { id: "cuidados", nome: "Cuidados do dia a dia", emoji: "💧", chamada: "Rega, terra, mudas de graça, praga e mato sem veneno.", cor: "#9B7BC8" },
];

export const COLECAO: LivroColecao[] = [
  { codigo: "TG004", slug: "cactos-e-babosa", titulo: "Cactos e Babosa", pdf: "TG004.pdf", tema: "suculentas" },
  { codigo: "TG005", slug: "rega-sem-afogar", titulo: "Rega sem Afogar", pdf: "TG005.pdf", tema: "cuidados" },
  { codigo: "TG006", slug: "mato-que-ensina", titulo: "O Mato que Ensina", pdf: "TG006.pdf", tema: "cuidados" },
  { codigo: "TG007", slug: "mudas-de-graca", titulo: "Mudas de Graça", pdf: "TG007.pdf", tema: "cuidados" },
  { codigo: "TG008", slug: "casa-com-pet", titulo: "Casa com Pet", pdf: "TG008.pdf", tema: "dentro-de-casa" },
  { codigo: "TG009", slug: "planta-sem-sol", titulo: "Planta sem Sol", pdf: "TG009.pdf", tema: "dentro-de-casa" },
  { codigo: "TG010", slug: "suculentas-sem-afogar", titulo: "Suculentas sem Afogar", pdf: "TG010.pdf", tema: "suculentas" },
  { codigo: "TG011", slug: "rosa-do-deserto", titulo: "Rosa-do-Deserto", pdf: "TG011.pdf", tema: "suculentas" },
  { codigo: "TG012", slug: "horta-em-vaso", titulo: "Horta em Vaso", pdf: "TG012.pdf", tema: "horta" },
  { codigo: "TG013", slug: "tomate-no-vaso", titulo: "Tomate no Vaso", pdf: "TG013.pdf", tema: "horta" },
  { codigo: "TG014", slug: "temperos-da-janela", titulo: "Temperos da Janela", pdf: "TG014.pdf", tema: "horta" },
  { codigo: "TG015", slug: "orquidea-florir-de-novo", titulo: "Florir de Novo", pdf: "TG015.pdf", tema: "orquideas" },
  { codigo: "TG016", slug: "cattleya-e-dendrobium", titulo: "Cattleya e Dendrobium", pdf: "TG016.pdf", tema: "orquideas" },
  { codigo: "TG017", slug: "orquidea-doente", titulo: "Orquídea Doente", pdf: "TG017.pdf", tema: "orquideas" },
  { codigo: "TG018", slug: "vaso-de-orquidea", titulo: "Vaso de Orquídea", pdf: "TG018.pdf", tema: "orquideas" },
  { codigo: "TG019", slug: "agaves-e-kalanchoes", titulo: "Agaves e Kalanchoes", pdf: "TG019.pdf", tema: "suculentas" },
  { codigo: "TG020", slug: "suculenta-pendente", titulo: "Suculenta Pendente", pdf: "TG020.pdf", tema: "suculentas" },
  { codigo: "TG021", slug: "rosa-do-deserto-enxerto-e-muda", titulo: "Enxerto e Muda", pdf: "TG021.pdf", tema: "suculentas" },
  { codigo: "TG022", slug: "composteira-em-casa", titulo: "Composteira em Casa", pdf: "TG022.pdf", tema: "cuidados" },
  { codigo: "TG023", slug: "armadilhas-e-aliados", titulo: "Armadilhas e Aliados", pdf: "TG023.pdf", tema: "cuidados" },
  { codigo: "TG024", slug: "jardim-do-zero", titulo: "Jardim do Zero", pdf: "TG024.pdf", tema: "jardim" },
  { codigo: "TG025", slug: "horta-de-semente", titulo: "Horta de Semente", pdf: "TG025.pdf", tema: "horta" },
  { codigo: "TG026", slug: "abelha-e-passarinho", titulo: "Abelha e Passarinho", pdf: "TG026.pdf", tema: "jardim" },
  { codigo: "TG027", slug: "pimenta-no-vaso", titulo: "Pimenta no Vaso", pdf: "TG027.pdf", tema: "horta" },
  { codigo: "TG028", slug: "arvore-no-quintal", titulo: "Árvore no Quintal", pdf: "TG028.pdf", tema: "jardim" },
  { codigo: "TG029", slug: "roseira-no-vaso", titulo: "Roseira no Vaso", pdf: "TG029.pdf", tema: "rosas" },
  { codigo: "TG030", slug: "roseira-doente", titulo: "Roseira Doente", pdf: "TG030.pdf", tema: "rosas" },
  { codigo: "TG031", slug: "poda-de-roseira", titulo: "Poda de Roseira", pdf: "TG031.pdf", tema: "rosas" },
  { codigo: "TG032", slug: "muda-de-rosa", titulo: "Muda de Rosa", pdf: "TG032.pdf", tema: "rosas" },
  { codigo: "TG033", slug: "anturio", titulo: "Antúrio", pdf: "TG033.pdf", tema: "dentro-de-casa" },
  { codigo: "TG034", slug: "costela-de-adao", titulo: "Costela-de-adão", pdf: "TG034.pdf", tema: "dentro-de-casa" },
  { codigo: "TG035", slug: "jiboia-e-filodendro", titulo: "Jiboia e Filodendro", pdf: "TG035.pdf", tema: "dentro-de-casa" },
  { codigo: "TG036", slug: "lirio-da-paz", titulo: "Lírio-da-paz", pdf: "TG036.pdf", tema: "dentro-de-casa" },
  { codigo: "TG037", slug: "bromelias", titulo: "Bromélias", pdf: "TG037.pdf", tema: "dentro-de-casa" },
  { codigo: "TG038", slug: "samambaias", titulo: "Samambaias", pdf: "TG038.pdf", tema: "dentro-de-casa" },
  { codigo: "TG039", slug: "morango-no-vaso", titulo: "Morango no Vaso", pdf: "TG039.pdf", tema: "horta" },
  { codigo: "TG040", slug: "microverdes", titulo: "Microverdes", pdf: "TG040.pdf", tema: "horta" },
  { codigo: "TG041", slug: "mato-sem-veneno", titulo: "Mato sem Veneno", pdf: "TG041.pdf", tema: "cuidados" },
  { codigo: "TG042", slug: "horta-na-varanda", titulo: "Horta na Varanda", pdf: "TG042.pdf", tema: "horta" },
  { codigo: "TG043", slug: "canteiro-elevado", titulo: "Canteiro Elevado", pdf: "TG043.pdf", tema: "horta" },
  { codigo: "TG044", slug: "ervas-secas", titulo: "Ervas Secas", pdf: "TG044.pdf", tema: "horta" },
  { codigo: "TG045", slug: "guardar-semente", titulo: "Guardar Semente", pdf: "TG045.pdf", tema: "horta" },
  { codigo: "TG046", slug: "flores-de-varanda", titulo: "Flores de Varanda", pdf: "TG046.pdf", tema: "jardim" },
  { codigo: "TG047", slug: "trepadeiras-floridas", titulo: "Trepadeiras Floridas", pdf: "TG047.pdf", tema: "jardim" },
  { codigo: "TG048", slug: "azaleia-e-hortensia", titulo: "Azaleia e Hortênsia", pdf: "TG048.pdf", tema: "jardim" },
  { codigo: "TG049", slug: "bulbos-que-voltam", titulo: "Bulbos que Voltam", pdf: "TG049.pdf", tema: "jardim" },
  { codigo: "TG050", slug: "jardim-tropical", titulo: "Jardim Tropical", pdf: "TG050.pdf", tema: "jardim" },
  { codigo: "TG051", slug: "palmeiras-de-casa", titulo: "Palmeiras de Casa", pdf: "TG051.pdf", tema: "dentro-de-casa" },
  { codigo: "TG052", slug: "violeta-e-parentes", titulo: "Violeta e Parentes", pdf: "TG052.pdf", tema: "dentro-de-casa" },
  { codigo: "TG053", slug: "folhagem-colorida", titulo: "Folhagem Colorida", pdf: "TG053.pdf", tema: "dentro-de-casa" },
  { codigo: "TG054", slug: "jardim-sem-sede", titulo: "Jardim sem Sede", pdf: "TG054.pdf", tema: "jardim" },
  { codigo: "TG055", slug: "frutifera-em-vaso", titulo: "Frutífera em Vaso", pdf: "TG055.pdf", tema: "horta" },
  { codigo: "TG056", slug: "gramado-bonito", titulo: "Gramado Bonito", pdf: "TG056.pdf", tema: "jardim" },
  { codigo: "TG057", slug: "adubo-caseiro", titulo: "Adubo Caseiro", pdf: "TG057.pdf", tema: "cuidados" },
  { codigo: "TG058", slug: "poda-sem-medo", titulo: "Poda sem Medo", pdf: "TG058.pdf", tema: "cuidados" },
  { codigo: "TG059", slug: "fungo-no-jardim", titulo: "Fungo no Jardim", pdf: "TG059.pdf", tema: "cuidados" },
  { codigo: "TG060", slug: "lesma-e-caracol", titulo: "Lesma e Caracol", pdf: "TG060.pdf", tema: "cuidados" },
  { codigo: "TG061", slug: "lavanda-e-alecrim", titulo: "Lavanda e Alecrim", pdf: "TG061.pdf", tema: "horta" },
  { codigo: "TG062", slug: "girassol", titulo: "Girassol", pdf: "TG062.pdf", tema: "jardim" },
  { codigo: "TG063", slug: "abobora-e-abobrinha", titulo: "Abóbora e Abobrinha", pdf: "TG063.pdf", tema: "horta" },
  { codigo: "TG064", slug: "feijao-e-milho", titulo: "Feijão e Milho", pdf: "TG064.pdf", tema: "horta" },
  { codigo: "TG065", slug: "cenoura-e-raizes", titulo: "Cenoura e Raízes", pdf: "TG065.pdf", tema: "horta" },
  { codigo: "TG066", slug: "comigo-ninguem-pode", titulo: "Comigo-ninguém-⁠pode", pdf: "TG066.pdf", tema: "dentro-de-casa" },
  { codigo: "TG067", slug: "hortela-e-manjericao", titulo: "Hortelã e Manjericão", pdf: "TG067.pdf", tema: "horta" },
  { codigo: "TG068", slug: "alface-e-folhas", titulo: "Alface e Folhas", pdf: "TG068.pdf", tema: "horta" },
  { codigo: "TG069", slug: "begonia-e-geranio", titulo: "Begônia e Gerânio", pdf: "TG069.pdf", tema: "dentro-de-casa" },
  { codigo: "TG070", slug: "ficus-e-hera", titulo: "Fícus e Hera", pdf: "TG070.pdf", tema: "dentro-de-casa" },
  { codigo: "TG071", slug: "hibisco-e-primavera", titulo: "Hibisco e Primavera", pdf: "TG071.pdf", tema: "jardim" },
  { codigo: "TG072", slug: "flores-comestiveis", titulo: "Flores que se Comem", pdf: "TG072.pdf", tema: "jardim" },
  { codigo: "TG074", slug: "espada-de-sao-jorge", titulo: "Espada-de-são-jorge", pdf: "TG074.pdf", tema: "dentro-de-casa" },
  { codigo: "TG075", slug: "minhocario-em-casa", titulo: "Minhocário", pdf: "TG075.pdf", tema: "cuidados" },
  { codigo: "TG077", slug: "cactos-de-colecao", titulo: "Cactos de Coleção", pdf: "TG077.pdf", tema: "suculentas" },
  { codigo: "TG078", slug: "suculentas-coloridas", titulo: "Suculentas Coloridas", pdf: "TG078.pdf", tema: "suculentas" },
  { codigo: "TG079", slug: "pimentas-do-mundo", titulo: "Pimentas do Mundo", pdf: "TG079.pdf", tema: "horta" },
  { codigo: "TG080", slug: "orquidea-na-arvore", titulo: "Orquídea na Árvore", pdf: "TG080.pdf", tema: "orquideas" },
  { codigo: "TG081", slug: "rosas-perfumadas", titulo: "Rosas Perfumadas", pdf: "TG081.pdf", tema: "rosas" },
  { codigo: "TG082", slug: "alocasia-e-filodendro", titulo: "Alocásia e Filodendro", pdf: "TG082.pdf", tema: "dentro-de-casa" },
  { codigo: "TG083", slug: "lirios-de-jardim", titulo: "Lírios de Jardim", pdf: "TG083.pdf", tema: "jardim" },
  { codigo: "TG085", slug: "jardim-de-borboleta", titulo: "Jardim de Borboleta", pdf: "TG085.pdf", tema: "jardim" },
  { codigo: "TG087", slug: "tomate-cereja", titulo: "Tomate Cereja", pdf: "TG087.pdf", tema: "horta" },
  { codigo: "TG088", slug: "batata-e-inhame", titulo: "Batata e Inhame", pdf: "TG088.pdf", tema: "horta" },
  { codigo: "TG089", slug: "beterraba-e-acelga", titulo: "Beterraba e Acelga", pdf: "TG089.pdf", tema: "horta" },
  { codigo: "TG090", slug: "ervilha-e-feijao", titulo: "Ervilha e Feijão", pdf: "TG090.pdf", tema: "horta" },
  { codigo: "TG091", slug: "pepino-e-berinjela", titulo: "Pepino e Berinjela", pdf: "TG091.pdf", tema: "horta" },
  { codigo: "TG092", slug: "flores-cheirosas", titulo: "Flores Cheirosas", pdf: "TG092.pdf", tema: "jardim" },
  { codigo: "TG093", slug: "flores-de-semente", titulo: "Flores de Semente", pdf: "TG093.pdf", tema: "jardim" },
  { codigo: "TG095", slug: "comedouro-e-ninho", titulo: "Comedouro e Ninho", pdf: "TG095.pdf", tema: "jardim" },
  { codigo: "TG096", slug: "roseira-no-jardim", titulo: "Roseira no Jardim", pdf: "TG096.pdf", tema: "rosas" },
  { codigo: "TG097", slug: "substrato-e-vaso", titulo: "Substrato e Vaso", pdf: "TG097.pdf", tema: "cuidados" },
  { codigo: "TG099", slug: "orquidea-no-dia-a-dia", titulo: "Orquídea no Dia a Dia", pdf: "TG099.pdf", tema: "orquideas" },
  { codigo: "TG100", slug: "jardim-gentil", titulo: "Jardim Gentil", pdf: "TG100.pdf", tema: "dentro-de-casa" },
  { codigo: "TG101", slug: "solo-vivo", titulo: "Solo Vivo", pdf: "TG101.pdf", tema: "cuidados" },
  { codigo: "TG102", slug: "cerca-viva-e-vento", titulo: "Cerca Viva e Vento", pdf: "TG102.pdf", tema: "jardim" },
  { codigo: "TG103", slug: "mato-teimoso", titulo: "Mato Teimoso", pdf: "TG103.pdf", tema: "cuidados" },
  { codigo: "TG104", slug: "horta-companheira", titulo: "Horta Companheira", pdf: "TG104.pdf", tema: "horta" },
  { codigo: "TG105", slug: "hotel-de-bicho", titulo: "Hotel de Bicho", pdf: "TG105.pdf", tema: "jardim" },
  { codigo: "TG106", slug: "clima-do-quintal", titulo: "Clima do Quintal", pdf: "TG106.pdf", tema: "jardim" },
  { codigo: "TG107", slug: "sementeira-caseira", titulo: "Sementeira Caseira", pdf: "TG107.pdf", tema: "horta" },
  { codigo: "TG108", slug: "sol-e-sombra", titulo: "Sol e Sombra", pdf: "TG108.pdf", tema: "jardim" },
  { codigo: "TG109", slug: "folhas-da-horta", titulo: "Folhas da Horta", pdf: "TG109.pdf", tema: "horta" },
  { codigo: "TG110", slug: "rosas-antigas", titulo: "Rosas Antigas", pdf: "TG110.pdf", tema: "rosas" },
  { codigo: "TG111", slug: "pulgao-e-cochonilha", titulo: "Pulgão e Cochonilha", pdf: "TG111.pdf", tema: "cuidados" },
  { codigo: "TG112", slug: "orquidea-de-pedra", titulo: "Orquídea de Pedra", pdf: "TG112.pdf", tema: "orquideas" },
  { codigo: "TG113", slug: "pimenta-no-canteiro", titulo: "Pimenta no Canteiro", pdf: "TG113.pdf", tema: "horta" },
  { codigo: "TG114", slug: "arvore-e-raiz", titulo: "Árvore e Raiz", pdf: "TG114.pdf", tema: "jardim" },
];

export function capaDoLivro(l: LivroColecao): string {
  return `${COLECAO_SITE_BASE}/guias/${l.slug}/capa.webp`;
}

export function pdfDoLivro(l: LivroColecao): string {
  return `${COLECAO_PDF_BASE}/${l.pdf}`;
}
