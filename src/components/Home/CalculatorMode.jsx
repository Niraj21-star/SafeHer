import { useState, useRef, useEffect } from 'react';
import { validateSecretPIN, triggerSilentSOS, getCovertSettings } from '../../services/covertService';
import toast from 'react-hot-toast';

const CalculatorMode = ({ onCovertTrigger }) => {
    const [display, setDisplay] = useState('0');
    const [history, setHistory] = useState('');
    const [operator, setOperator] = useState(null);
    const [previousValue, setPreviousValue] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState(null);
    const inputHistory = useRef('');

    useEffect(() => {
        return () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
        };
    }, [longPressTimer]);

    const handleNumber = (num) => {
        // Track input for PIN detection
        inputHistory.current += num;
        
        // Keep only last 10 characters
        if (inputHistory.current.length > 10) {
            inputHistory.current = inputHistory.current.slice(-10);
        }

        if (waitingForOperand) {
            setDisplay(String(num));
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? String(num) : display + num);
        }
    };

    const handleOperator = (nextOperator) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operator) {
            const currentValue = previousValue || 0;
            const newValue = calculate(currentValue, inputValue, operator);
            setDisplay(String(newValue));
            setPreviousValue(newValue);
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
        setHistory(`${previousValue || inputValue} ${nextOperator}`);
    };

    const calculate = (a, b, op) => {
        switch (op) {
            case '+':
                return a + b;
            case '-':
                return a - b;
            case '×':
                return a * b;
            case '÷':
                return b !== 0 ? a / b : 0;
            default:
                return b;
        }
    };

    const handleEquals = async () => {
        // Add '=' to input history
        inputHistory.current += '=';

        // Check for secret PIN
        const settings = getCovertSettings();
        if (settings.enabled && validateSecretPIN(inputHistory.current)) {
            try {
                await triggerSilentSOS(onCovertTrigger, 'calculator-pin');
                // Keep calculator display normal - don't show any indication
            } catch (error) {
                // Silent error handling
            }
            
            // Reset input history after PIN detection
            inputHistory.current = '';
        }

        // Perform normal calculation
        const inputValue = parseFloat(display);

        if (previousValue !== null && operator) {
            const newValue = calculate(previousValue, inputValue, operator);
            setDisplay(String(newValue));
            setHistory('');
            setPreviousValue(null);
            setOperator(null);
            setWaitingForOperand(true);
        }
    };

    const handleEqualsMouseDown = () => {
        // Start long-press timer for covert trigger
        const timer = setTimeout(async () => {
            console.log('[Calculator] Long-press detected on =');
            
            try {
                await triggerSilentSOS(onCovertTrigger, 'calculator-longpress');
            } catch (error) {
                if (error.message !== 'Cancelled') {
                    console.error('[Calculator] Silent SOS failed:', error);
                }
            }
        }, 2000); // 2 seconds long-press
        
        setLongPressTimer(timer);
    };

    const handleEqualsMouseUp = () => {
        // Cancel long-press timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setHistory('');
        setPreviousValue(null);
        setOperator(null);
        setWaitingForOperand(false);
        inputHistory.current = '';
    };

    const handleDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const handlePercent = () => {
        const value = parseFloat(display);
        setDisplay(String(value / 100));
    };

    const handlePlusMinus = () => {
        const value = parseFloat(display);
        setDisplay(String(value * -1));
    };

    return (
        <div className="calculator-mode w-full max-w-sm mx-auto">
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Display */}
                <div className="bg-gray-800 p-6">
                    {history && (
                        <div className="text-gray-400 text-sm mb-1 text-right">
                            {history}
                        </div>
                    )}
                    <div className="text-white text-4xl font-light text-right overflow-hidden overflow-ellipsis">
                        {display}
                    </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-px bg-gray-800 p-1">
                    {/* Row 1 */}
                    <button
                        onClick={handleClear}
                        className="calc-btn calc-btn-function"
                    >
                        AC
                    </button>
                    <button
                        onClick={handlePlusMinus}
                        className="calc-btn calc-btn-function"
                    >
                        +/-
                    </button>
                    <button
                        onClick={handlePercent}
                        className="calc-btn calc-btn-function"
                    >
                        %
                    </button>
                    <button
                        onClick={() => handleOperator('÷')}
                        className="calc-btn calc-btn-operator"
                    >
                        ÷
                    </button>

                    {/* Row 2 */}
                    <button
                        onClick={() => handleNumber(7)}
                        className="calc-btn"
                    >
                        7
                    </button>
                    <button
                        onClick={() => handleNumber(8)}
                        className="calc-btn"
                    >
                        8
                    </button>
                    <button
                        onClick={() => handleNumber(9)}
                        className="calc-btn"
                    >
                        9
                    </button>
                    <button
                        onClick={() => handleOperator('×')}
                        className="calc-btn calc-btn-operator"
                    >
                        ×
                    </button>

                    {/* Row 3 */}
                    <button
                        onClick={() => handleNumber(4)}
                        className="calc-btn"
                    >
                        4
                    </button>
                    <button
                        onClick={() => handleNumber(5)}
                        className="calc-btn"
                    >
                        5
                    </button>
                    <button
                        onClick={() => handleNumber(6)}
                        className="calc-btn"
                    >
                        6
                    </button>
                    <button
                        onClick={() => handleOperator('-')}
                        className="calc-btn calc-btn-operator"
                    >
                        -
                    </button>

                    {/* Row 4 */}
                    <button
                        onClick={() => handleNumber(1)}
                        className="calc-btn"
                    >
                        1
                    </button>
                    <button
                        onClick={() => handleNumber(2)}
                        className="calc-btn"
                    >
                        2
                    </button>
                    <button
                        onClick={() => handleNumber(3)}
                        className="calc-btn"
                    >
                        3
                    </button>
                    <button
                        onClick={() => handleOperator('+')}
                        className="calc-btn calc-btn-operator"
                    >
                        +
                    </button>

                    {/* Row 5 */}
                    <button
                        onClick={() => handleNumber(0)}
                        className="calc-btn col-span-2"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDecimal}
                        className="calc-btn"
                    >
                        .
                    </button>
                    <button
                        onClick={handleEquals}
                        onMouseDown={handleEqualsMouseDown}
                        onMouseUp={handleEqualsMouseUp}
                        onTouchStart={handleEqualsMouseDown}
                        onTouchEnd={handleEqualsMouseUp}
                        className="calc-btn calc-btn-operator"
                    >
                        =
                    </button>
                </div>
            </div>

            <style jsx>{`
                .calc-btn {
                    background: #505050;
                    color: white;
                    border: none;
                    padding: 24px;
                    font-size: 24px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.15s;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }

                .calc-btn:active {
                    background: #707070;
                }

                .calc-btn-function {
                    background: #a5a5a5;
                    color: #000;
                }

                .calc-btn-function:active {
                    background: #c5c5c5;
                }

                .calc-btn-operator {
                    background: #ff9500;
                }

                .calc-btn-operator:active {
                    background: #ffb143;
                }

                @media (max-width: 640px) {
                    .calc-btn {
                        padding: 20px;
                        font-size: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CalculatorMode;
