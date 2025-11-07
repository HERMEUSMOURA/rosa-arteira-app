import React from "react";
import {
  View, Text, Image, ImageBackground, StyleSheet,
  FlatList, Dimensions, TouchableOpacity, ActivityIndicator
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';

const { width, height } = Dimensions.get('window');
const CAROUSEL_HEIGHT = Math.min(Math.max(height * 0.35, 180), 300);

interface Slide {
  image: any;
  title: string;
  subtitle: string;
  button: string;
}

interface Service {
  icon: string;
  title: string;
  text: string;
}

interface Product {
  id: string;
  nome: string;
  preco: string;
  imagem: any;
}

const slides: Slide[] = [
  {
    image: require('../../assets/images/slide1.jpg'),
    title: 'Procura agilidade e profissionalismo na área de costura?',
    subtitle: 'Fale conosco, Temos mais de 7 anos trabalhando com corte e costura',
    button: 'Confira nossos Produtos',
  },
  {
    image: require('../../assets/images/slide2.jpg'),
    title: 'Procura um novo estilo pra sua cozinha?',
    subtitle: 'Conte conosco! Temos uma vasta seleção de estilos para garantir o melhor!',
    button: 'Confira nossos conjuntos',
  },
  {
    image: require('../../assets/images/slide5.jpg'),
    title: 'Tem uma roupa dos sonhos?',
    subtitle: 'Aqui ela se torna realidade! Faça hoje mesmo o seu Orçamento',
    button: 'Quero um orçamento!',
  },
];

const services: Service[] = [
  { icon: 'pencil', title: 'Costura', text: 'Restauramos peças com cuidado e atenção aos detalhes.' },
  { icon: 'shopping-cart', title: 'Artesanato', text: 'Peças personalizadas únicas sob encomenda.' },
  { icon: 'paint-brush', title: 'Confecção', text: 'Transforme seu projeto em realidade com nossa equipe.' },
  { icon: 'handshake', title: 'Suporte', text: 'Oferecemos suporte completo sobre seus pedidos e produtos.' },
];

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D9A59A" />
      </View>
    );
  }

  const renderSlide = ({ item }: { item: Slide }) => (
    <ImageBackground
      source={item.image}
      style={[styles.slide, { height: CAROUSEL_HEIGHT, width }]}
      resizeMode="cover"
    >
      <View style={styles.slideOverlay}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        <TouchableOpacity style={styles.slideButton}>
          <Text style={styles.slideButtonText}>{item.button}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );

  const renderService = ({ item }: { item: Service }) => (
    <View style={styles.serviceBox}>
      <FontAwesome name={item.icon as any} size={36} color="#444" style={styles.serviceIcon} />
      <Text style={styles.serviceTitle}>{item.title}</Text>
      <Text style={styles.serviceText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header - Fundo colorido, texto branco */}
            <View style={styles.header}>
              <Image source={require('../../assets/images/novoLogo.png')} style={styles.logo} />
              <Text style={styles.logoText}>Rosa Arteira</Text>
            </View>

            {/* Carousel */}
            <FlatList
              data={slides}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              renderItem={renderSlide}
              style={{ height: CAROUSEL_HEIGHT }}
            />

            {/* Sobre - Fundo branco, texto preto */}
            <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.sectionTitle, { color: '#444444' }]}>Sobre a Rosa Arteira</Text>
              <View style={styles.aboutContainer}>
                <Image source={require('../../assets/images/sobre.jpg')} style={styles.aboutImage} />
                <View style={styles.aboutText}>
                  <Text style={[styles.aboutParagraph, { color: '#555555' }]}>
                    Nossos produtos são personalizados de acordo com o seu prazer.
                  </Text>
                  <Text style={[styles.aboutParagraph, { color: '#555555' }]}>
                    Após a aquisição das medidas e do modelo, seus sonhos estão mais próximos.
                  </Text>
                  <Text style={[styles.aboutParagraph, { color: '#555555' }]}>
                    Seja jogo de cozinha, artesanato ou costura, proporcionamos o melhor trabalho.
                  </Text>
                  <View style={styles.aboutList}>
                    <Text style={[styles.listItem, { color: '#65DAF9' }]}>• Utilizamos seu modelo enviado</Text>
                    <Text style={[styles.listItem, { color: '#65DAF9' }]}>• Múltiplas alternativas de tecido ao seu gosto</Text>
                    <Text style={[styles.listItem, { color: '#65DAF9' }]}>• Trabalhamos com referências fornecidas pelo cliente</Text>
                    <Text style={[styles.listItem, { color: '#65DAF9' }]}>• Suporte WhatsApp</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          
          <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[styles.sectionTitle, { color: '#444444' }]}>Nossas Especialidades</Text>
            <FlatList
              data={services}
              numColumns={2}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <View style={styles.serviceBox}>
                  <FontAwesome name={item.icon as any} size={36} color="#444" style={styles.serviceIcon} />
                  <Text style={[styles.serviceTitle, { color: '#444444' }]}>{item.title}</Text>
                  <Text style={[styles.serviceText, { color: '#555555' }]}>{item.text}</Text>
                </View>
              )}
              scrollEnabled={false}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingBottom: 80 }, // Aumentado para 80
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  header: { flexDirection: 'row', alignItems: 'center', padding: 16,paddingTop:40 , backgroundColor: '#D9A59A' },
  logo: { width: 50, height: 50, borderRadius: 8 },
  logoText: { fontFamily: 'Pacifico_400Regular', fontSize: 24, color: '#FFFFFF', marginLeft: 8 },

  slide: { justifyContent: 'center', alignItems: 'center' },
  slideOverlay: { 
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%', 
    padding: width < 360 ? 6 : 12 
  },
  slideTitle: { 
    fontSize: width < 360 ? 14 : 18, 
    color: '#D9A59A', 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 6, 
    textShadowColor: 'black', 
    textShadowOffset: { width: 1, height: 1 }, 
    textShadowRadius: 2 
  },
  slideSubtitle: { 
    fontSize: width < 360 ? 12 : 14, 
    color: '#D9A59A', 
    textAlign: 'center', 
    marginBottom: 12, 
    textShadowColor: 'black', 
    textShadowOffset: { width: 1, height: 1 }, 
    textShadowRadius: 1 
  },
  slideButton: { 
    backgroundColor: '#D9A59A', 
    paddingHorizontal: width < 360 ? 12 : 16, 
    paddingVertical: width < 360 ? 6 : 8, 
    borderRadius: 30 
  },
  slideButtonText: { fontSize: width < 360 ? 12 : 14, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' },

  section: { padding: 16 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },

  aboutContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  aboutImage: { width: 150, height: 150, marginBottom: 16, borderRadius: 8 },
  aboutText: { flex: 1, paddingHorizontal: 8 },
  aboutParagraph: { fontSize: 14, marginBottom: 6 },
  aboutList: { marginTop: 8 },
  listItem: { fontSize: 14, marginBottom: 4 },

  serviceBox: { width: '48%', alignItems: 'center', marginBottom: 16 },
  serviceIcon: { marginBottom: 8 },
  serviceTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  serviceText: { fontSize: 12, textAlign: 'center' },

  productCard: { width: '48%', backgroundColor: '#f9f9f9', marginBottom: 16, borderRadius: 12, padding: 8 },
  productImage: { width: '100%', height: 120, borderRadius: 8 },
  productName: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  productPrice: { fontSize: 12, color: '#555', marginBottom: 8 },
  productButton: { backgroundColor: '#FF6600', padding: 6, borderRadius: 8 },
  productButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
});