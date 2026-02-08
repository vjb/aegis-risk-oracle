import Chat from './components/Chat';

export default function App() {
    // Mock function to satisfy prop requirement for now
    const handleIntent = (intent: string) => {
        console.log("Intent triggered:", intent);
    };

    return (
        <div data-theme="dark" className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-base-100 rounded-box shadow-xl overflow-hidden">
                <div className="p-4 bg-primary text-primary-content font-bold text-center">
                    Aegis Chat
                </div>
                <div className="h-[600px] flex flex-col">
                    <Chat
                        onIntent={handleIntent}
                        isProcessing={false}
                        workflowStatus="IDLE"
                        currentStep={0}
                    />
                </div>
            </div>
        </div>
    );
}
