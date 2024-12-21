import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

interface WheelItem {
    name: string;
}

const SpinningWheel: React.FC = () => {
    ChartJS.register(ArcElement, Tooltip, Legend);

    const [wheelItems, setWheelItems] = useState<WheelItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [spinning, setSpinning] = useState<boolean>(false);
    const [finalRotation, setFinalRotation] = useState<number>(0); // Keep track of the final rotation
    const [showResult, setShowResult] = useState<boolean>(false);
    const chartRef = useRef<ChartJS<'doughnut', number[], unknown> | null>(null);

    const assignColorToId = (index: number) => {
        const colors = [
            '#FF5733', '#3498DB', '#2ECC71', '#F0B31A',
            '#9B59B6', '#E74C3C', '#1ABC9C', '#D35400',
            '#C0392B', '#7F8C8D',
        ];
        return colors[index % colors.length];
    };

    const data = {
        datasets: [
            {
                data: wheelItems.map(() => 1), // Equal data for all items
                backgroundColor: wheelItems.map((_, index) => assignColorToId(index)),
                borderColor: wheelItems.map((_, index) => assignColorToId(index)),
                cutout: '67%',
            },
        ],
        labels: wheelItems.map((item) => item.name),
        hoverOffset: 3,
    };

    const spinWheel = async () => {
        if (spinning) return;
        setSpinning(true);
        setSelectedItem(null);
        setShowResult(false);

        const numItems = wheelItems.length;
        const itemAngle = 360 / numItems;
        const baseRotation = 1440 + 360;

        if (!chartRef.current) {
            console.error('Chart not initialized!');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/wheel/spin', {
                method: 'POST',
            });
            const data = await response.json();
            const selectedIndex = wheelItems.findIndex(
                (item) => item.name === data.result
            );
            const targetAngle = selectedIndex * itemAngle;
            const randomOffset = Math.floor(Math.random() * (itemAngle / 2));

            // Calculate new final rotation based on previous final rotation
            const newFinalRotation = finalRotation + baseRotation - targetAngle + randomOffset;
            setFinalRotation(newFinalRotation);

            setSelectedItem(data.result);

            // Update chart options for the animation
            chartRef.current.options.rotation = newFinalRotation;
            chartRef.current.update();
        } catch (error) {
            console.error('Error spinning wheel:', error);
        } finally {
            setTimeout(() => {
                setSpinning(false);
                setShowResult(true);
            }, 4000);
        }
    };

    useEffect(() => {
        const fetchWheelItems = async () => {
            try {
                const response = await fetch('http://localhost:8000/admin/wheel-config');
                const data = await response.json();
                setWheelItems(data.items);
            } catch (error) {
                console.error('Error fetching wheel items:', error);
            }
        };

        fetchWheelItems();
    }, []);

    return (
        <div className="relative w-[340px] h-[340px] md:w-[410px] md:h-[410px] flex items-center justify-center p-4">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-center z-10 text-white">
                {spinning && (
                    <div className="flex items-center flex-row justify-center uppercase font-bold text-gray-200">
                        Spinning...
                    </div>
                )}

                {showResult && selectedItem && (
                    <div className="flex -mt-12 flex-row justify-center text-2xl font-bold text-green-400">
                        {selectedItem}
                    </div>
                )}
                {!spinning && (
                    <button
                        onClick={spinWheel}
                        className="px-4 py-2 mt-12 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                        Spin
                    </button>
                )}
            </div>
            <div className="relative w-[300px] h-[300px] md:w-[368px] md:h-[368px] p-4">
                <Doughnut
                    data={data}
                    options={{
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom',
                            },
                            tooltip: {
                                enabled: false, // Disable the default tooltip
                            },
                        },
                        rotation: finalRotation,
                        animation: {
                            duration: spinning ? 4000 : 0,
                            easing: 'easeOutQuart',
                        },
                    }}
                    ref={chartRef}
                />
                <div
                    id="arrow-icon"
                    className="absolute top-1.5 md:top-[7px] left-1/2 transform -translate-x-1/2 text-white rotate-180"
                >
                    <svg
                        className="h-7 w-7 text-white z-20"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        fill="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="12 2 22 22 2 22"></polygon>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SpinningWheel;