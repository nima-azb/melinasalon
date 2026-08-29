export type GalleryItem = {
  id: string;
  title: string;
  category: "مو" | "رنگ و لایت" | "میکاپ";
  image: string;
};

export const galleryItems: GalleryItem[] = [
  {
    id: "gallery-01",
    title: "استایل و فرم‌دهی مو",
    category: "مو",
    image: "/images/gallery/gallery-01.jpg",
  },
  {
    id: "gallery-02",
    title: "بالیاژ طبیعی",
    category: "رنگ و لایت",
    image: "/images/gallery/gallery-02.jpg",
  },
  {
    id: "gallery-03",
    title: "میکاپ مجلسی",
    category: "میکاپ",
    image: "/images/gallery/gallery-03.jpg",
  },
  {
    id: "gallery-04",
    title: "رنگ و لایت",
    category: "رنگ و لایت",
    image: "/images/gallery/gallery-04.jpg",
  },
  {
    id: "gallery-05",
    title: "استایل حرفه‌ای مو",
    category: "مو",
    image: "/images/gallery/gallery-05.jpg",
  },
  {
    id: "gallery-06",
    title: "میکاپ ظریف و طبیعی",
    category: "میکاپ",
    image: "/images/gallery/gallery-06.jpg",
  },
];
