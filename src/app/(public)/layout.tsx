import { Footer } from "@/components/public/footer";
import { Navbar } from "@/components/public/navbar";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1" id="top">
        {children}
      </main>

      <Footer />
    </div>
  );
}
