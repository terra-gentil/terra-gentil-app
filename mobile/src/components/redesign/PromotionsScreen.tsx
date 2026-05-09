import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ShoppingBag, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  FONTS,
  SIZES,
  shadowChunky,
} from "../../constants/theme";
import Pills from "./Pills";
import SectionTitle from "./SectionTitle";
import { FlashDealCard, RecommendedDealCard, FlashDeal, RecommendedDeal } from "./DealCard";
import { listarConsultas } from "../../storage/historico";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Categoria = "Todas" | "Vasos" | "Adubos" | "Sementes" | "Ferramentas";
const CATEGORIAS: Categoria[] = ["Todas", "Vasos", "Adubos", "Sementes", "Ferramentas"];

interface FlashDealComCat extends FlashDeal {
  categoria: Categoria;
}
interface RecComCat extends RecommendedDeal {
  categoria: Categoria;
}

const FLASH_DEALS: FlashDealComCat[] = [
  {
    id: "vaso-auto",
    nome: "Vaso autoirrigável 18cm",
    precoDe: "R$ 89",
    precoPor: "R$ 39",
    desconto: "-56%",
    vendido: 70,
    gradient: ["#bae6fd", "#0284c7"],
    categoria: "Vasos",
  },
  {
    id: "adubo-liq",
    nome: "Adubo líquido 500ml",
    precoDe: "R$ 45",
    precoPor: "R$ 22",
    desconto: "-51%",
    vendido: 58,
    gradient: ["#fde68a", "#b45309"],
    categoria: "Adubos",
  },
  {
    id: "kit-sementes",
    nome: "Kit sementes 12 ervas",
    precoDe: "R$ 65",
    precoPor: "R$ 29",
    desconto: "-55%",
    vendido: 82,
    gradient: ["#86efac", "#15803d"],
    categoria: "Sementes",
  },
  {
    id: "tesoura-poda",
    nome: "Tesoura de poda inox",
    precoDe: "R$ 78",
    precoPor: "R$ 49",
    desconto: "-37%",
    vendido: 35,
    gradient: ["#fbcfe8", "#be185d"],
    categoria: "Ferramentas",
  },
];

const REC_DEALS: RecComCat[] = [
  {
    id: "npk-organico",
    nome: "Adubo NPK orgânico",
    descricao: "Pra folhagens. 1x por mês",
    preco: "R$ 24,90",
    tag: "Recomendado",
    gradient: ["#86efac", "#22c55e"],
    categoria: "Adubos",
  },
  {
    id: "vaso-terracota",
    nome: "Vaso decor terracota",
    descricao: "20cm. Drenagem perfeita",
    preco: "R$ 49,00",
    tag: "Mais comprado",
    gradient: ["#fde68a", "#f59e0b"],
    categoria: "Vasos",
  },
  {
    id: "regador-1l",
    nome: "Regador bico fino 1L",
    descricao: "Ideal pra mudas e suculentas",
    preco: "R$ 32,00",
    tag: "Novidade",
    gradient: ["#bae6fd", "#38bdf8"],
    categoria: "Ferramentas",
  },
];

const DURACAO_OFERTA_MS = 5 * 24 * 60 * 60 * 1000;

function calcularRestante(alvo: number) {
  const diff = Math.max(0, alvo - Date.now());
  const dias = Math.floor(diff / (24 * 60 * 60 * 1000));
  const horas = Math.floor((diff / (60 * 60 * 1000)) % 24);
  const mins = Math.floor((diff / (60 * 1000)) % 60);
  return {
    dias: String(dias).padStart(2, "0"),
    horas: String(horas).padStart(2, "0"),
    mins: String(mins).padStart(2, "0"),
  };
}

export default function PromotionsScreen({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [filtro, setFiltro] = useState<Categoria>("Todas");
  const [plantaUser, setPlantaUser] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<number>(() => Date.now() + DURACAO_OFERTA_MS);
  const [restante, setRestante] = useState(() => calcularRestante(Date.now() + DURACAO_OFERTA_MS));

  useEffect(() => {
    if (!visible) return;
    const novoAlvo = Date.now() + DURACAO_OFERTA_MS;
    setAlvo(novoAlvo);
    setRestante(calcularRestante(novoAlvo));
    listarConsultas(1).then((c) => {
      if (c.length > 0 && c[0].nome_popular) {
        setPlantaUser(c[0].nome_popular);
      } else {
        setPlantaUser(null);
      }
    });
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setRestante(calcularRestante(alvo));
    }, 60000);
    return () => clearInterval(interval);
  }, [visible, alvo]);

  const flashFiltrado = useMemo(() => {
    if (filtro === "Todas") return FLASH_DEALS;
    return FLASH_DEALS.filter((d) => d.categoria === filtro);
  }, [filtro]);

  const recFiltrado = useMemo(() => {
    if (filtro === "Todas") return REC_DEALS;
    return REC_DEALS.filter((d) => d.categoria === filtro);
  }, [filtro]);

  const tituloRec = plantaUser
    ? `🌱 Pra sua ${plantaUser}`
    : "🌱 Pra suas plantinhas";

  function avisoEmBreve() {
    Alert.alert(
      "Loja chegando",
      "A loja oficial Terra Gentil está sendo preparada. Em breve você vai poder comprar tudo isso por aqui mesmo.",
      [{ text: "Combinado", style: "default" }]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.greenDark} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Promoções</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tituloWrap}>
            <Text style={styles.tituloPrincipal}>Promoções 🛍️</Text>
            <Text style={styles.tituloSub}>Achados pra cuidar do seu jardim</Text>
          </View>

          <Pills
            items={CATEGORIAS as unknown as string[]}
            active={filtro}
            onChange={(v) => setFiltro(v as Categoria)}
            color={COLORS.sky}
            colorDeep="#0284c7"
          />

          {/* Hero banner */}
          <View style={styles.heroWrap}>
            <View style={styles.hero}>
              <LinearGradient
                colors={["#38bdf8", "#0284c7", "#075985"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.heroCircleA} />
              <View style={styles.heroCircleB} />

              <View style={styles.heroBody}>
                <Text style={styles.heroLabel}>SEMANA DA TERRA · 5 DIAS</Text>
                <Text style={styles.heroTitle}>Até 60% off</Text>
                <Text style={styles.heroSub}>
                  Em vasos, adubos e sementes selecionadas
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={avisoEmBreve}
                  style={styles.heroCta}
                >
                  <ShoppingBag size={14} color="#0284c7" strokeWidth={2.6} />
                  <Text style={styles.heroCtaText}>Ver ofertas</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.countdown}>
                {[
                  { v: restante.dias, l: "DIA" },
                  { v: restante.horas, l: "HR" },
                  { v: restante.mins, l: "MIN" },
                ].map((c) => (
                  <View key={c.l} style={styles.countBlock}>
                    <Text style={styles.countNumero}>{c.v}</Text>
                    <Text style={styles.countLabel}>{c.l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Flash deals */}
          {flashFiltrado.length > 0 && (
            <>
              <SectionTitle
                title="🔥 Ofertas relâmpago"
                action="Ver tudo →"
                actionColor={COLORS.coralDeep}
                onAction={avisoEmBreve}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flashRow}
              >
                {flashFiltrado.map((d) => (
                  <FlashDealCard key={d.id} deal={d} onPress={avisoEmBreve} />
                ))}
              </ScrollView>
            </>
          )}

          {/* Recomendados personalizados */}
          {recFiltrado.length > 0 && (
            <>
              <SectionTitle title={tituloRec} />
              <View style={styles.recList}>
                {recFiltrado.map((d) => (
                  <RecommendedDealCard
                    key={d.id}
                    deal={d}
                    onPress={avisoEmBreve}
                    onAdd={avisoEmBreve}
                  />
                ))}
              </View>
            </>
          )}

          {flashFiltrado.length === 0 && recFiltrado.length === 0 && (
            <View style={styles.vazioBox}>
              <Text style={styles.vazioTitulo}>Nada por aqui</Text>
              <Text style={styles.vazioTexto}>
                Ainda não temos ofertas em {filtro}. Toque em "Todas" pra ver
                tudo que está rolando.
              </Text>
            </View>
          )}

          {/* Rodape disclaimer */}
          <View style={styles.rodape}>
            <Text style={styles.rodapeTitulo}>Loja oficial chegando</Text>
            <Text style={styles.rodapeTexto}>
              Estamos preparando a loja Terra Gentil pra você comprar tudo
              direto pelo app, com curadoria do Doutor Gentileza.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  tituloWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tituloPrincipal: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xxl,
    color: COLORS.greenDark,
    lineHeight: 32,
  },
  tituloSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: COLORS.inkSoft,
    marginTop: 2,
  },

  // Hero
  heroWrap: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  hero: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 20,
    minHeight: 180,
    ...shadowChunky("#075985"),
  },
  heroCircleA: {
    position: "absolute",
    top: -20,
    right: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroCircleB: {
    position: "absolute",
    bottom: -40,
    left: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  heroBody: {
    position: "relative",
    maxWidth: "70%",
  },
  heroLabel: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 11,
    color: "#fff",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: 32,
    color: "#fff",
    marginTop: 6,
    lineHeight: 34,
  },
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: "rgba(255,255,255,0.95)",
    marginTop: 6,
    lineHeight: 18,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3,
  },
  heroCtaText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 12,
    color: "#0284c7",
    letterSpacing: 0.3,
  },
  countdown: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 6,
  },
  countBlock: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 38,
    alignItems: "center",
  },
  countNumero: {
    fontFamily: FONTS.displayBlack,
    fontSize: 16,
    color: "#fff",
    lineHeight: 18,
  },
  countLabel: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 8,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.6,
    marginTop: 1,
  },

  // Flash row
  flashRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 18,
  },

  // Rec list
  recList: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 16,
  },

  // Vazio
  vazioBox: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  vazioTitulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.md,
    color: COLORS.greenDark,
    marginBottom: 4,
  },
  vazioTexto: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 18,
  },

  // Rodape
  rodape: {
    margin: 16,
    backgroundColor: COLORS.skySoft,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.sky,
  },
  rodapeTitulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body + 1,
    color: "#075985",
    marginBottom: 4,
  },
  rodapeTexto: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: "#0c4a6e",
    lineHeight: 18,
  },
});
