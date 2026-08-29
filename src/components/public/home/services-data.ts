export type Service = {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string;
  image: string;
};

export const services: Service[] = [
  {
    id: "hair-styling",
    category: "مو و استایل",
    title: "براشینگ و استایل مو",
    description: "استایل حرفه‌ای مو متناسب با فرم چهره و سلیقه شما.",
    price: "از ۳۵۰,۰۰۰ تومان",
    image: "/images/services/hair-styling.jpg",
  },
  {
    id: "hair-color",
    category: "رنگ و لایت",
    title: "رنگ، لایت و بالیاژ",
    description: "رنگ و تکنیک‌های تخصصی با انتخاب تناژ متناسب با چهره شما.",
    price: "از ۹۰۰,۰۰۰ تومان",
    image: "/images/services/hair-color.jpg",
  },
  {
    id: "makeup",
    category: "میکاپ",
    title: "میکاپ تخصصی",
    description: "میکاپ حرفه‌ای برای مراسم، مهمانی و موقعیت‌های خاص.",
    price: "از ۸۰۰,۰۰۰ تومان",
    image: "/images/services/makeup.jpg",
  },
  {
    id: "hair-care",
    category: "مراقبت و احیا",
    title: "احیا و مراقبت مو",
    description: "خدمات تخصصی مراقبت، آبرسانی و احیای موهای آسیب‌دیده.",
    price: "از ۷۰۰,۰۰۰ تومان",
    image: "/images/services/hair-care.jpg",
  },
  {
    id: "hair-cut",
    category: "مو و استایل",
    title: "کوتاهی و فرم‌دهی",
    description: "کوتاهی و فرم‌دهی متناسب با فرم صورت و جنس مو.",
    price: "از ۴۵۰,۰۰۰ تومان",
    image: "/images/services/hair-cut.jpg",
  },
  {
    id: "special-services",
    category: "خدمات ویژه",
    title: "خدمات تخصصی VIP",
    description: "تجربه‌ای اختصاصی با ترکیبی از خدمات منتخب سالن.",
    price: "از ۱,۵۰۰,۰۰۰ تومان",
    image: "/images/services/vip.jpg",
  },
];
