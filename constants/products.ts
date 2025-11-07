import { StoredProduct } from "../hooks/storage";

export const initialProducts: StoredProduct[] = [
  {
    id: "init-1",
    name: "Vestido Floral",
    price: 120,
    image: require("../assets/images/vestifloral.jpeg"),
  },
  {
    id: "init-2",
    name: "Blusa de Algodão",
    price: 80,
    image: require("../assets/images/camisalgodao.jpeg"),
  },
  {
    id: "init-3",
    name: "Calça Jeans",
    price: 150,
    image: require("../assets/images/jeans.jpeg"),
  },
  {
    id: "init-4",
    name: "Saia Midi",
    price: 90,
    image: require("../assets/images/minisaia.jpeg"),
  },
];
