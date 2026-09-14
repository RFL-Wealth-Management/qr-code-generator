import QrGenerator from "@/components/QrGenerator";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">QR Code Generator</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Build a tracked link with UTM parameters and download it as a QR code.
        </p>
      </header>
      <QrGenerator />
    </main>
  );
}
