import { useEffect, useMemo, useState } from 'react';
import tickingSound from "../assets/spin-wheel-sound.mp3"
import {ISegments, ISpinWheelProps} from './SpinWheel.interface';

const ticTicSound: HTMLAudioElement | null = typeof window !== 'undefined' ? new Audio(tickingSound) : new Audio();

const SpinWheelOrigin: React.FC<ISpinWheelProps> = ({
                                                  segments,
                                                  onFinished,
                                                  primaryColor = 'black',
                                                  contrastColor = 'white',
                                                  buttonText = 'Spin',
                                                  isOnlyOnce = false,
                                                  size = 290,
                                                  upDuration = 100,
                                                  downDuration = 600,
                                                  fontFamily = 'Arial',
                                                  arrowLocation = 'center',
                                                  showTextOnSpin = true,
                                                  isSpinSound = true,

                                              }: ISpinWheelProps) => {
    // Separate arrays without nullish values
    const segmentTextArray = segments.map((segment) => segment.name).filter(Boolean);
    const segColorArray = segments.map((segment) => segment.color).filter(Boolean);

    const [isFinished, setFinished] = useState<boolean>(false);
    const [isStarted, setIsStarted] = useState<boolean>(false);
    const [needleText, setNeedleText] = useState<string>("");
    const [targetedSegment, setTargetedSegment] = useState<ISegments>(null);
    const [isFetching, setIsFetching] = useState<boolean>(false);

    let currentSegment = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timerHandle: any = 0;
    const timerDelay = segmentTextArray.length;
    let angleCurrent = 0;
    let angleDelta = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let canvasContext: any = null;
    let maxSpeed = Math.PI / segmentTextArray.length;
    const upTime = segmentTextArray.length * upDuration;
    const downTime = segmentTextArray.length * downDuration;
    let spinStart = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let frames = 0;
    const centerX = (size);
    const centerY = (size);

    useEffect(() => {
        wheelInit();
        setTimeout(() => {
            window.scrollTo(0, 1);
        }, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segments]);

    const wheelInit = () => {
        initCanvas();
        wheelDraw();
    };

    const fetchTargetedSegment = async () => {
        if (isStarted || isFetching) return;
        setIsFetching(true);
        try {
            const response = await fetch('http://backend.paepen.io/wheel/spin', {
                method: 'POST',
            });
            const data = await response.json();
            setTargetedSegment(data.result);
            console.log('Targeted Segment:', data.result);
        } catch (error) {
            console.error('Error fetching targeted segment:', error);
        } finally {

            setIsFetching(false);
        }
    }

    const initCanvas = () => {
        let canvas: HTMLCanvasElement | null = document.getElementById('canvas') as HTMLCanvasElement;

        if (!canvas) {
            // Create a new canvas if it doesn't exist
            canvas = document.createElement('canvas');
            canvas.setAttribute('width', `${size * 2}`);
            canvas.setAttribute('height', `${size * 2}`);
            canvas.setAttribute('id', 'canvas');
            document?.getElementById('wheel')?.appendChild(canvas);
        }
        canvasContext = canvas.getContext('2d');

        canvas.style.borderRadius = '50%'; // Set border radius for a circular shape

        canvas?.addEventListener('click', spin, false);
    };

    const spin = () => {
        if (isStarted || isFetching) return;
        fetchTargetedSegment()
        setIsStarted(true);
        if (timerHandle === 0) {
            spinStart = new Date().getTime();
            maxSpeed = Math.PI / segmentTextArray.length;
            frames = 0;
            timerHandle = setInterval(onTimerTick, timerDelay * 5);
            // Determine the winning segment using Math.random()
            const randomIndex = Math.floor(Math.random() * segmentTextArray.length);
            const randomSegment = segmentTextArray[randomIndex];
            console.log('Winning Segment:', randomSegment);

        }
    };

    const onTimerTick = () => {
        frames++;
        wheelDraw();
        const duration = (new Date().getTime() - spinStart)
        let progress = 0;
        let finished = false;

        if (duration < upTime) {
            progress = duration / upTime;
            angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2);
        }
        else {
            progress = duration / downTime;
            angleDelta =
                maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
            if (progress >= 1) finished = true;
        }

        angleCurrent += angleDelta;
        while (angleCurrent >= Math.PI * 2) angleCurrent -= Math.PI * 2;

        const change = angleCurrent + Math.PI / 2;
        let i = segmentTextArray.length - Math.floor((change / (Math.PI * 2)) * segmentTextArray.length) - 1;
        if (i < 0) i = i + segmentTextArray.length;
        else if (i >= segmentTextArray.length) i = i - segmentTextArray.length;
        currentSegment = segmentTextArray[i];
        // if the current segment is the same as the target segment and it has spin 2x 360 degrees, stop the wheel
        if (currentSegment === targetedSegment && frames > segmentTextArray.length * 8) {
            finished = true;
        }
        if (finished) {
            setFinished(true);
            onFinished(currentSegment);
            clearInterval(timerHandle);
            timerHandle = 0;
            angleDelta = 0;
            ticTicSound.pause(); // Pause tic-tic sound when the wheel stops spinning
            ticTicSound.currentTime = 0; // Reset the tic-tic sound to the beginning
        }
    };

    useMemo(() => {
        ticTicSound.currentTime = 0;
        if (needleText && isSpinSound && isStarted) {
            ticTicSound?.play();
        } else {
            ticTicSound.pause(); // Pause tic-tic sound when the wheel stops spinning
            ticTicSound.currentTime = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needleText, isSpinSound]);

    const wheelDraw = () => {
        clear()
        drawWheel()
        drawNeedle()
    }

    const drawSegment = (key: number, lastAngle: number, angle: number) => {
        const ctx = canvasContext
        const value = segmentTextArray[key]
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, size, lastAngle, angle, false)
        ctx.lineTo(centerX, centerY)
        ctx.closePath()
        ctx.fillStyle = segColorArray[key]
        ctx.fill()
        ctx.stroke()
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate((lastAngle + angle) / 2)
        ctx.fillStyle = contrastColor
        ctx.font = 'bold 1em ' + fontFamily
        ctx.fillText(value.substring(0, 21), size / 2 + 20, 0)
        ctx.restore()
    }

    const drawWheel = () => {
        const ctx = canvasContext
        let lastAngle = angleCurrent
        const len = segmentTextArray.length
        const PI2 = Math.PI * 2
        ctx.lineWidth = 1
        ctx.strokeStyle = primaryColor
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.font = '1em ' + fontFamily
        for (let i = 1; i <= len; i++) {
            const angle = PI2 * (i / len) + angleCurrent
            drawSegment(i - 1, lastAngle, angle)
            lastAngle = angle
        }

        // Draw a center circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, 30, 0, PI2, false)
        ctx.closePath()
        ctx.fillStyle = primaryColor
        ctx.lineWidth = 2
        ctx.strokeStyle = contrastColor
        ctx.fill()
        ctx.font = 'bold 1em ' + fontFamily
        ctx.fillStyle = contrastColor
        ctx.textAlign = 'center'
        ctx.fillText(buttonText, centerX, centerY + 3)
        ctx.stroke()

        // Draw outer circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, size, 0, PI2, false)
        ctx.closePath()

        ctx.lineWidth = 4
        ctx.strokeStyle = primaryColor
        ctx.stroke()
    }

    const drawNeedle = () => {
        const ctx = canvasContext
        ctx.lineWidth = 1
        ctx.strokeStyle = contrastColor
        ctx.fileStyle = contrastColor
        ctx.beginPath()

        if (arrowLocation === "top") {
            ctx.moveTo(centerX + 20, centerY / 15)
            ctx.lineTo(centerX - 20, centerY / 15)
            ctx.lineTo(centerX, centerY - (centerY / 1.35))
        } else {
            ctx.moveTo(centerX + 20, centerY - 30)
            ctx.lineTo(centerX - 20, centerY - 30)
            ctx.lineTo(centerX, centerY - (centerY / 2.5))
        }

        ctx.closePath()
        ctx.fill()
        const change = angleCurrent + Math.PI / 2
        let i =
            segmentTextArray.length -
            Math.floor((change / (Math.PI * 2)) * segmentTextArray.length) -
            1
        if (i < 0) i = i + segmentTextArray.length
        else if (i >= segmentTextArray.length) i = i - segmentTextArray.length
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = primaryColor
        ctx.font = 'bold 1.5em ' + fontFamily
        currentSegment = segmentTextArray[i]
        setNeedleText(segmentTextArray[i])
    }

    const clear = () => {
        const ctx = canvasContext;
        ctx.clearRect(0, 0, size, size);
    };

    return (
        <div id='wheel'>
            {segments&&
                <canvas
                id='canvas'
                width={size * 2}
                height={size * 2}
                style={{
                    pointerEvents: isFinished && isOnlyOnce ? 'none' : 'auto',
                }}
            />}
            {showTextOnSpin && isStarted &&
                <div style={{ textAlign: "center", padding: "20px", fontWeight: "bold", fontSize: "1.5em", fontFamily: fontFamily }}>
                    {needleText}
                </div>}
        </div>
    );
};

export default SpinWheelOrigin