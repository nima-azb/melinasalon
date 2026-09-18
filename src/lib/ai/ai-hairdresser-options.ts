export const hairColors = [
  {
    id: "natural-black",
    label: "مشکی طبیعی",
    swatch: "#1b1512",
    prompt: "natural black hair color",
  },
  {
    id: "dark-brown",
    label: "قهوه‌ای تیره",
    swatch: "#3b2314",
    prompt: "dark brown hair color",
  },
  {
    id: "warm-brown",
    label: "قهوه‌ای گرم",
    swatch: "#5c3a21",
    prompt: "warm brown hair color",
  },
  {
    id: "light-brown",
    label: "قهوه‌ای روشن",
    swatch: "#8a5a34",
    prompt: "light brown hair color",
  },
  {
    id: "honey-blonde",
    label: "بلوند عسلی",
    swatch: "#c99552",
    prompt: "honey blonde hair color",
  },
  {
    id: "ash-blonde",
    label: "بلوند دودی",
    swatch: "#b9a179",
    prompt: "ash blonde hair color",
  },
  {
    id: "copper",
    label: "مسی",
    swatch: "#b5551f",
    prompt: "natural copper hair color",
  },
  {
    id: "burgundy",
    label: "زرشکی",
    swatch: "#5c1a2e",
    prompt: "deep burgundy hair color",
  },
] as const;

export const hairstyles = [
  {
    id: "long-layered",
    label: "لایه‌بلند",
    prompt: "long layered hairstyle",
  },
  {
    id: "shoulder-layered",
    label: "لایه تا شانه",
    prompt: "shoulder-length layered hairstyle",
  },
  {
    id: "bob",
    label: "باب",
    prompt: "modern bob hairstyle",
  },
  {
    id: "short",
    label: "کوتاه",
    prompt: "short modern hairstyle",
  },
  {
    id: "wavy",
    label: "موج ملایم",
    prompt: "soft natural waves hairstyle",
  },
  {
    id: "straight",
    label: "صاف",
    prompt: "smooth straight hairstyle",
  },
  {
    id: "curly",
    label: "فر طبیعی",
    prompt: "defined natural curly hairstyle",
  },
] as const;

export const makeupStyles = [
  {
    id: "natural",
    label: "طبیعی",
    prompt: "natural makeup with subtle enhancement",
  },
  {
    id: "soft-glam",
    label: "گلم ملایم",
    prompt: "soft glam makeup with elegant and natural-looking enhancement",
  },
  {
    id: "evening",
    label: "شب",
    prompt: "elegant evening makeup",
  },
  {
    id: "minimal",
    label: "مینیمال",
    prompt: "minimal makeup with a clean natural appearance",
  },
] as const;

export type HairColorId = (typeof hairColors)[number]["id"];
export type HairstyleId = (typeof hairstyles)[number]["id"];
export type MakeupStyleId = (typeof makeupStyles)[number]["id"];
