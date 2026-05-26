import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { X, Check, Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIAS, PALETAS, TAGS_DISPONIVEIS, paletaPorId } from "../../data/comunidade";
import { adicionarMeuPost } from "../../storage/comunidade";
import { getToken, AuthUser } from "../../storage/auth";
import { criarTopic } from "../../api/forum";
import LoginModal from "./LoginModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCriado: (viaApi?: boolean) => void;
}

export default function NovaPostagemModal({ visible, onClose, onCriado }: Props) {
  const insets = useSafeAreaInsets();
  const [titulo, setTitulo] = useState("");
  const [cat, setCat] = useState(CATEGORIAS[0]);
  const [paletaId, setPaletaId] = useState(PALETAS[0].id);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [loginVisivel, setLoginVisivel] = useState(false);

  const paleta = paletaPorId(paletaId);

  function reset() {
    setTitulo("");
    setCat(CATEGORIAS[0]);
    setPaletaId(PALETAS[0].id);
    setTagsSelecionadas([]);
    setImageUri(null);
  }

  async function handleAdicionarFoto() {
    Alert.alert(
      "Adicionar foto",
      "De onde vem a foto da sua planta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Tirar agora", onPress: tirarFoto },
        { text: "Galeria", onPress: escolherGaleria },
      ],
    );
  }

  async function tirarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Pra tirar foto eu preciso de acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.6,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function escolherGaleria() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Pra escolher uma foto eu preciso de acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.6,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  function removerFoto() {
    setImageUri(null);
  }

  function toggleTag(tag: string) {
    setTagsSelecionadas((curr) =>
      curr.includes(tag) ? curr.filter((t) => t !== tag) : [...curr, tag]
    );
  }

  async function handlePublicar() {
    const tituloLimpo = titulo.trim();
    if (tituloLimpo.length < 10) {
      Alert.alert(
        "Título muito curto",
        "Escreva pelo menos 10 caracteres para o seu post fazer sentido.",
      );
      return;
    }
    setSalvando(true);
    try {
      const token = await getToken();
      if (token) {
        await criarTopic({ title: tituloLimpo, body: tituloLimpo, category: cat }, token);
        reset();
        onCriado(true);
      } else {
        setLoginVisivel(true);
      }
    } catch (err) {
      console.log("[nova-postagem] erro:", err);
      Alert.alert("Ops", "Não foi possível publicar agora. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  function handleClose() {
    if (titulo.trim().length > 0 || imageUri) {
      Alert.alert(
        "Descartar?",
        "Você escreveu algo. Sair sem publicar vai apagar o que escreveu.",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              reset();
              onClose();
            },
          },
        ],
      );
      return;
    }
    onClose();
  }

  async function handleLoginSuccess(user: AuthUser) {
    setLoginVisivel(false);
    const tituloLimpo = titulo.trim();
    if (tituloLimpo.length < 10) return;
    const token = await getToken();
    if (!token) return;
    setSalvando(true);
    try {
      await criarTopic({ title: tituloLimpo, body: tituloLimpo, category: cat }, token);
      reset();
      onCriado(true);
    } catch (err) {
      console.log("[nova-postagem] erro pos-login:", err);
      Alert.alert("Ops", "Não foi possível publicar agora. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.ink} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova postagem</Text>
          <View style={{ width: 32 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Preview do hero */}
            <View style={styles.previewWrap}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <LinearGradient
                    colors={paleta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.previewCircleA} />
                  <View style={styles.previewCircleB} />
                </>
              )}
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.previewLabel}>{cat.toUpperCase()}</Text>
              <Text style={styles.previewTitle} numberOfLines={3}>
                {titulo.trim() ? titulo : "Seu título aparece aqui"}
              </Text>
              {imageUri && (
                <TouchableOpacity
                  onPress={removerFoto}
                  style={styles.previewRemove}
                  hitSlop={6}
                  activeOpacity={0.85}
                >
                  <Trash2 size={16} color={COLORS.coralDeep} strokeWidth={2.6} />
                  <Text style={styles.previewRemoveText}>Remover foto</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Foto */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAdicionarFoto}
              style={[
                styles.fotoBtn,
                imageUri && { backgroundColor: paleta.accent + "15", borderColor: paleta.accent },
              ]}
            >
              {imageUri ? (
                <Camera size={18} color={paleta.accent} strokeWidth={2.4} />
              ) : (
                <ImageIcon size={18} color={COLORS.greenDark} strokeWidth={2.4} />
              )}
              <Text
                style={[
                  styles.fotoBtnText,
                  imageUri && { color: paleta.accent },
                ]}
              >
                {imageUri ? "Trocar foto" : "Adicionar foto da planta"}
              </Text>
            </TouchableOpacity>

            {/* Categoria */}
            <Text style={styles.sectionLabel}>Categoria</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              {CATEGORIAS.map((c) => {
                const ativo = c === cat;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCat(c)}
                    activeOpacity={0.7}
                    style={[
                      styles.pill,
                      ativo && { backgroundColor: paleta.accent, borderColor: paleta.accent },
                    ]}
                  >
                    <Text style={[styles.pillText, ativo && styles.pillTextOn]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Título */}
            <Text style={styles.sectionLabel}>Título</Text>
            <TextInput
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ex: Minha jiboia está com folhas amarelas, o que faço?"
              placeholderTextColor={COLORS.inkMute}
              multiline
              maxLength={140}
              style={styles.input}
            />
            <Text style={styles.helper}>
              {titulo.length}/140 — capricha! Quanto mais claro o título, mais gente ajuda.
            </Text>

            {/* Cor */}
            <Text style={styles.sectionLabel}>Cor do post</Text>
            <View style={styles.coresRow}>
              {PALETAS.map((p) => {
                const ativo = p.id === paletaId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => setPaletaId(p.id)}
                    style={[styles.corCard, ativo && { borderColor: p.accent, borderWidth: 3 }]}
                  >
                    <LinearGradient
                      colors={p.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {ativo && (
                      <View style={styles.corCheck}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tags */}
            <Text style={styles.sectionLabel}>Tags (opcional)</Text>
            <View style={styles.tagsWrap}>
              {TAGS_DISPONIVEIS.map((t) => {
                const ativo = tagsSelecionadas.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleTag(t)}
                    activeOpacity={0.7}
                    style={[
                      styles.tag,
                      ativo && { backgroundColor: paleta.accent, borderColor: paleta.accent },
                    ]}
                  >
                    <Text style={[styles.tagText, ativo && styles.tagTextOn]}>#{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Bottom CTA */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={salvando || titulo.trim().length < 10}
              onPress={handlePublicar}
              style={[
                styles.publicarBtn,
                {
                  backgroundColor:
                    titulo.trim().length < 10 ? COLORS.inkMute : paleta.accent,
                  shadowColor:
                    titulo.trim().length < 10
                      ? COLORS.inkMute
                      : paleta.accentDeep,
                },
              ]}
            >
              <Text style={styles.publicarText}>
                {salvando ? "Publicando..." : "Publicar"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      <LoginModal
        visible={loginVisivel}
        onClose={() => setLoginVisivel(false)}
        onLogin={handleLoginSuccess}
      />
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  previewWrap: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.greenDark,
    marginBottom: 18,
    ...shadowSoft(),
  },
  previewCircleA: {
    position: "absolute",
    top: 24,
    left: 38,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  previewCircleB: {
    position: "absolute",
    top: 90,
    right: 24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  previewLabel: {
    position: "absolute",
    top: 14,
    left: 14,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewTitle: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    fontFamily: FONTS.displayBlack,
    fontSize: 17,
    color: "#fff",
    lineHeight: 22,
  },
  previewRemove: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: COLORS.coralDeep,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  previewRemoveText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.coralDeep,
    letterSpacing: 0.3,
  },
  fotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.green,
    marginBottom: 14,
  },
  fotoBtnText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.greenDark,
  },
  sectionLabel: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.greenDark,
    marginTop: 6,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  pillsRow: {
    gap: 8,
    paddingRight: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  pillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
  },
  pillTextOn: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.ink,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 4,
  },
  helper: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  coresRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  corCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  corCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  tagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.xs,
    color: COLORS.inkSoft,
  },
  tagTextOn: {
    color: "#fff",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  publicarBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...shadowChunky(),
  },
  publicarText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body + 1,
    color: "#fff",
    letterSpacing: 0.4,
  },
});
