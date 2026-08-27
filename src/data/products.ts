import azul from "@/assets/camiseta_azul_front.jpeg.asset.json";
import azulBack from "@/assets/camiseta_azul_back.jpeg.asset.json";
import azulModel from "@/assets/camiseta_azul_modelo.jpeg.asset.json";
import orbit from "@/assets/camiseta_orbit_front.jpeg.asset.json";
import orbitBack from "@/assets/camiseta_orbit_back.jpeg.asset.json";
import orbitModel from "@/assets/camiseta_orbit_modelo.jpeg.asset.json";
import sun from "@/assets/camiseta_sun_front.jpeg.asset.json";
import sunBack from "@/assets/camiseta_sun_back.jpeg.asset.json";
import sunModel from "@/assets/camiseta_sun_modelo.jpeg.asset.json";
import gris from "@/assets/camiseta_gris_front.jpeg.asset.json";
import grisBack from "@/assets/camiseta_gris_back.jpeg.asset.json";
import grisModel from "@/assets/camiseta_gris_modelo.jpeg.asset.json";
import gorra from "@/assets/gorra_front.jpeg.asset.json";
import gorraModel from "@/assets/gorra_model.jpeg.asset.json";

export type Product = {
  /** Id estable del producto (coincide con el slug). Fuente de verdad para el checkout. */
  id: string;
  slug: string;
  name: string;
  /** Precio unitario en céntimos, IVA incluido. Única fuente de verdad del importe. */
  priceCents: number;
  /** Peso aproximado de la prenda con packaging, en gramos. Usado para el cálculo de envío. */
  weightGrams: number;
  front: string;
  back: string;
  images: string[];
  category: string;
  sizes: string[];
  description: string;
  details: string[];
};

const camisetaSizes = ["S", "M", "L", "XL"];

export const products: Product[] = [
  {
    id: "camiseta-azul",
    slug: "camiseta-azul",
    name: "Camiseta Azul",
    priceCents: 2397,
    weightGrams: 220,
    front: azulBack.url,
    back: azul.url,
    images: [azulBack.url, azul.url, azulModel.url],
    category: "Camiseta",
    sizes: camisetaSizes,
    description:
      "Camiseta azul grisáceo de corte oversize, fabricada en 100% algodón. Su color sobrio y su fit amplio la hacen una prenda cómoda, versátil y diferente. Perfecta para verano gracias a su tejido suave y transpirable, manteniendo un estilo limpio y relajado.",
    details: [
      "100% algodón.",
      "Corte oversize.",
      "Color azul grisáceo.",
      "Manga corta amplia.",
      "Cuello redondo.",
      "Tejido cómodo y transpirable.",
      "Perfecta para verano.",
      "Prenda unisex.",
    ],
  },
  {
    id: "camiseta-orbit",
    slug: "camiseta-orbit",
    name: "Camiseta Blanca Orbit",
    priceCents: 2397,
    weightGrams: 220,
    front: orbitBack.url,
    back: orbit.url,
    images: [orbitBack.url, orbit.url, orbitModel.url],
    category: "Camiseta",
    sizes: camisetaSizes,
    description:
      "Camiseta blanca de corte oversize, confeccionada en 100% algodón. Una prenda fresca, limpia y cómoda, perfecta para los días de verano. Su fit amplio aporta libertad de movimiento y una estética relajada, manteniendo una sensación de calidad en el tejido.",
    details: [
      "100% algodón.",
      "Corte oversize.",
      "Color blanco.",
      "Manga corta.",
      "Cuello redondo.",
      "Tacto suave y cómodo.",
      "Tejido fresco para verano.",
      "Prenda unisex.",
    ],
  },
  {
    id: "camiseta-sun",
    slug: "camiseta-sun",
    name: "Camiseta Blanca Sun",
    priceCents: 2397,
    weightGrams: 220,
    front: sunBack.url,
    back: sun.url,
    images: [sunBack.url, sun.url, sunModel.url],
    category: "Camiseta",
    sizes: camisetaSizes,
    description:
      "Camiseta blanca oversize de 100% algodón, pensada para ofrecer comodidad, frescura y buena caída. Su color blanco la convierte en una prenda fácil de combinar, ideal para looks de verano y para llevar tanto sola como con otras capas ligeras.",
    details: [
      "100% algodón.",
      "Corte oversize.",
      "Color blanco.",
      "Manga corta.",
      "Cuello redondo.",
      "Tacto suave y cómodo.",
      "Tejido fresco para verano.",
      "Prenda unisex.",
    ],
  },
  {
    id: "camiseta-gris",
    slug: "camiseta-gris",
    name: "Camiseta Gris",
    priceCents: 2397,
    weightGrams: 220,
    front: grisBack.url,
    back: gris.url,
    images: [grisBack.url, gris.url, grisModel.url],
    category: "Camiseta",
    sizes: camisetaSizes,
    description:
      "Camiseta gris oscuro de corte oversize, confeccionada en 100% algodón. Una prenda cómoda, fresca y resistente, con un color fácil de combinar y un acabado de gran calidad. Ideal para llevar en verano con un estilo relajado y versátil.",
    details: [
      "100% algodón.",
      "Corte oversize.",
      "Color gris oscuro.",
      "Manga corta amplia.",
      "Cuello redondo.",
      "Tejido suave y transpirable.",
      "Perfecta para verano.",
      "Prenda unisex.",
    ],
  },
  {
    id: "gorra-verde",
    slug: "gorra-verde",
    name: "Gorra Verde",
    priceCents: 1497,
    weightGrams: 120,
    front: gorra.url,
    back: gorraModel.url,
    images: [gorra.url, gorraModel.url],
    category: "Gorra",
    sizes: ["Talla única"],
    description:
      "Gorra verde con efecto vintage, cómoda y de gran calidad. Su acabado lavado le da un aspecto único y fácil de combinar, perfecto para completar cualquier outfit de verano o de diario. Una prenda ligera, versátil y con un estilo relajado.",
    details: [
      "Color verde vintage.",
      "Acabado lavado.",
      "Visera curva.",
      "Ajuste cómodo.",
      "Ligera y fácil de llevar.",
      "Perfecta para verano.",
      "Ideal para uso diario.",
      "Prenda unisex.",
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}
