export const hairColors = [
  {
    id: "natural-black",
    label: "Natural Black",
    prompt: "natural black hair color",
  },
  {
    id: "dark-brown",
    label: "Dark Brown",
    prompt: "dark brown hair color",
  },
  {
    id: "warm-brown",
    label: "Warm Brown",
    prompt: "warm brown hair color",
  },
  {
    id: "light-brown",
    label: "Light Brown",
    prompt: "light brown hair color",
  },
  {
    id: "honey-blonde",
    label: "Honey Blonde",
    prompt: "honey blonde hair color",
  },
  {
    id: "ash-blonde",
    label: "Ash Blonde",
    prompt: "ash blonde hair color",
  },
  {
    id: "copper",
    label: "Copper",
    prompt: "natural copper hair color",
  },
  {
    id: "burgundy",
    label: "Burgundy",
    prompt: "deep burgundy hair color",
  },
] as const;

export const hairstyles = [
  {
    id: "long-layered",
    label: "Long Layered",
    prompt: "long layered hairstyle",
  },
  {
    id: "shoulder-layered",
    label: "Shoulder-Length Layered",
    prompt: "shoulder-length layered hairstyle",
  },
  {
    id: "bob",
    label: "Bob",
    prompt: "modern bob hairstyle",
  },
  {
    id: "short",
    label: "Short",
    prompt: "short modern hairstyle",
  },
  {
    id: "wavy",
    label: "Soft Waves",
    prompt: "soft natural waves hairstyle",
  },
  {
    id: "straight",
    label: "Straight",
    prompt: "smooth straight hairstyle",
  },
  {
    id: "curly",
    label: "Curly",
    prompt: "defined natural curly hairstyle",
  },
] as const;

export const makeupStyles = [
  {
    id: "natural",
    label: "Natural",
    prompt: "natural makeup with subtle enhancement",
  },
  {
    id: "soft-glam",
    label: "Soft Glam",
    prompt: "soft glam makeup with elegant and natural-looking enhancement",
  },
  {
    id: "evening",
    label: "Evening",
    prompt: "elegant evening makeup",
  },
  {
    id: "minimal",
    label: "Minimal",
    prompt: "minimal makeup with a clean natural appearance",
  },
] as const;

export type HairColorId = (typeof hairColors)[number]["id"];
export type HairstyleId = (typeof hairstyles)[number]["id"];
export type MakeupStyleId = (typeof makeupStyles)[number]["id"];
