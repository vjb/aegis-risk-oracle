import Chat from "@/components/Chat";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function Home() {
    return (
        <main className="h-screen w-full relative flex flex-col items-center justify-center antialiased">
            <div className="max-w-2xl mx-auto p-4 z-10 w-full">
                <Chat />
            </div>
            <BackgroundBeams />
        </main>
    );
}
