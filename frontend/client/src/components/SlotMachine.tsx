import React, { useState, useEffect, useRef } from 'react';

interface SlotItem {
    name: string;
}

const SlotMachine: React.FC = () => {
    const [slotItems, setSlotItems] = useState<SlotItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [spinning, setSpinning] = useState<boolean>(false);
    const [reelPosition, setReelPosition] = useState<number>(0); // Only one reel position now
    const [showResult, setShowResult] = useState<boolean>(false);
    const reelRef = useRef<HTMLDivElement>(null);

    const correctReelPosition = (position: number) => {
        const numItems = slotItems.length;
        return (position + numItems * 1000) % numItems;
    }

    const spinSlotMachine = async () => {
        if (spinning) return;
        setSpinning(true);
        setSelectedItem(null);
        setShowResult(false);

        // Reset reel position to 0 at the start of each spin
        setReelPosition(0);

        // Calculate the number of full iterations for the animation
        const numIterations = 5; // Increased number of full iterations before stopping

        // Update reel position for the spinning animation
        const finalPosition = numIterations * slotItems.length;
        const finalReelPosition = correctReelPosition(finalPosition);
        setReelPosition(finalReelPosition);

        try {
            const response = await fetch('http://localhost:8000/wheel/spin', {
                method: 'POST',
            });
            const data = await response.json();
            setSelectedItem(data.result);

            // Calculate the target index for the reel
            const targetIndex = slotItems.findIndex((item) => item.name === data.result);

            // Calculate the number of items to move to reach the target index
            const numItemsToTarget =
                targetIndex >= 0
                    ? (targetIndex - (finalPosition % slotItems.length) + slotItems.length) %
                    slotItems.length
                    : 0;

            // Calculate the final position for the reel to center the selected item
            const finalReelPosition =
                finalPosition + numItemsToTarget;
            const correctedFinalReelPosition = correctReelPosition(finalReelPosition);
            setReelPosition(correctedFinalReelPosition);
        } catch (error) {
            console.error('Error spinning slot machine:', error);
        } finally {
            setTimeout(() => {
                setSpinning(false);
                setShowResult(true);
            }, 4000 + 500);
        }
    };

    useEffect(() => {
        const fetchSlotItems = async () => {
            try {
                const response = await fetch('http://localhost:8000/admin/wheel-config');
                const data = await response.json();
                setSlotItems(data.items);
            } catch (error) {
                console.error('Error fetching slot items:', error);
            }
        };

        fetchSlotItems();
    }, []);

    const itemHeight = 32; // Height of each slot item in pixels

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div
                className="relative w-48 h-32 bg-gray-200 overflow-hidden border-4 border-gray-400 rounded-md"
            >
                <div
                    ref={reelRef}
                    className={`reel-container transition-transform duration-[4000ms] ease-in-out`}
                    style={{
                        transform: `translateY(-${
                            reelPosition * itemHeight - itemHeight / 2
                        }px)`,
                    }}
                >
                    {/* Render the items multiple times for continuous looping */}
                    {Array.from({
                        length: Math.max(
                            1,
                            Math.ceil((reelPosition + 1) / (slotItems.length || 1)) + 1
                        ),
                    }).map((_, arrayIndex) =>
                        slotItems.map((item, itemIndex) => (
                            <div
                                key={`${arrayIndex}-${itemIndex}`}
                                className="w-full h-32 flex items-center justify-center text-xl font-bold text-black"
                            >
                                {item.name}
                            </div>
                        ))
                    )}
                </div>
            </div>
            <button
                onClick={spinSlotMachine}
                className={`px-4 py-2 mt-6 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    spinning ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={spinning}
            >
                Spin
            </button>
            {showResult && selectedItem && (
                <div className="mt-4 text-2xl font-bold text-green-400">
                    {selectedItem}
                </div>
            )}
        </div>
    );
};

export default SlotMachine;