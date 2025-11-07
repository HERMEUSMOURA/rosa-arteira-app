import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

// Garantimos que o TypeScript aceite documentDirectory
const DOCUMENT_DIR = (FileSystem as any).documentDirectory as string;

// Pasta onde as imagens ficarão salvas
const DIR = DOCUMENT_DIR + "produtos/";

export async function ensureDirectoryExists() {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    }
  } catch (e) {
    console.error("ensureDirectoryExists error", e);
  }
}

export async function saveImageToAppFolder(pickedUri: string): Promise<string | null> {
  try {
    await ensureDirectoryExists();

    const extMatch = pickedUri.split(".").pop()?.split("?")[0] || "jpg";
    const filename = `${Date.now()}.${extMatch}`;
    const dest = DIR + filename;

    await FileSystem.copyAsync({ from: pickedUri, to: dest });

    return dest; // retorna a URI final salva no app
  } catch (e) {
    console.error("saveImageToAppFolder error", e);
    Alert.alert("Erro", "Não foi possível salvar a imagem.");
    return null;
  }
}

