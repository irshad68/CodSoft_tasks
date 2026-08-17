const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound(type = "click") {
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value =
        type === "operator" ? 520 :
        type === "equals" ? 680 :
        type === "clear" ? 260 : 420;

    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.07
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.07);
}

const currentDisplay = document.getElementById("current");
const previousDisplay = document.getElementById("previous");

let currentValue = "0";
let previousValue = "";
let operator = null;
let waitingForNextValue = false;

function updateDisplay() {
    currentDisplay.textContent = currentValue;
    previousDisplay.textContent =
        previousValue && operator
            ? `${previousValue} ${operator}`
            : "";
}

function inputNumber(number) {
    if (waitingForNextValue) {
        currentValue = number === "." ? "0." : number;
        waitingForNextValue = false;
        updateDisplay();
        return;
    }

    if (number === "." && currentValue.includes(".")) {
        return;
    }

    if (currentValue === "0" && number !== ".") {
        currentValue = number;
    } else {
        currentValue += number;
    }

    updateDisplay();
}

function chooseOperator(nextOperator) {
    if (operator && waitingForNextValue) {
        operator = nextOperator;
        updateDisplay();
        return;
    }

    if (operator && previousValue !== "") {
        calculate();
    }

    previousValue = currentValue;
    operator = nextOperator;
    waitingForNextValue = true;
    updateDisplay();
}

function calculate() {
    if (!operator || previousValue === "") {
        return;
    }

    const first = Number(previousValue);
    const second = Number(currentValue);
    let result;

    switch (operator) {
        case "+":
            result = first + second;
            break;
        case "−":
            result = first - second;
            break;
        case "×":
            result = first * second;
            break;
        case "÷":
            if (second === 0) {
                currentValue = "Cannot divide by 0";
                previousValue = "";
                operator = null;
                updateDisplay();
                return;
            }
            result = first / second;
            break;
    }

    currentValue = Number.isInteger(result)
        ? String(result)
        : String(Number(result.toFixed(10)));

    previousValue = "";
    operator = null;
    waitingForNextValue = true;
    updateDisplay();
}

function clearCalculator() {
    currentValue = "0";
    previousValue = "";
    operator = null;
    waitingForNextValue = false;
    updateDisplay();
}

function deleteNumber() {
    if (waitingForNextValue || currentValue === "Cannot divide by 0") {
        return;
    }

    currentValue =
        currentValue.length > 1
            ? currentValue.slice(0, -1)
            : "0";

    updateDisplay();
}

function percentage() {
    if (currentValue === "Cannot divide by 0") {
        return;
    }

    currentValue = String(Number(currentValue) / 100);
    updateDisplay();
}

document.querySelectorAll("[data-number]").forEach(button => {
    button.addEventListener("click", () => {
        playClickSound();
        inputNumber(button.dataset.number);
    });
});

document.querySelectorAll("[data-operator]").forEach(button => {
    button.addEventListener("click", () => {
        playClickSound("operator");
        chooseOperator(button.dataset.operator);
    });
});

document.querySelector('[data-action="calculate"]').addEventListener("click", () => {
    playClickSound("equals");
    calculate();
});

document.querySelector('[data-action="clear"]').addEventListener("click", () => {
    playClickSound("clear");
    clearCalculator();
});

document.querySelector('[data-action="delete"]').addEventListener("click", () => {
    playClickSound();
    deleteNumber();
});

document.querySelector('[data-action="percent"]').addEventListener("click", () => {
    playClickSound("operator");
    percentage();
});

document.addEventListener("keydown", event => {
    const key = event.key;

    if ((key >= "0" && key <= "9") || key === ".") {
        playClickSound();
        inputNumber(key);
    } else if (key === "+") {
        playClickSound("operator");
        chooseOperator("+");
    } else if (key === "-") {
        playClickSound("operator");
        chooseOperator("−");
    } else if (key === "*") {
        playClickSound("operator");
        chooseOperator("×");
    } else if (key === "/") {
        event.preventDefault();
        playClickSound("operator");
        chooseOperator("÷");
    } else if (key === "Enter" || key === "=") {
        playClickSound("equals");
        calculate();
    } else if (key === "Escape") {
        playClickSound("clear");
        clearCalculator();
    } else if (key === "Backspace") {
        playClickSound();
        deleteNumber();
    } else if (key === "%") {
        playClickSound("operator");
        percentage();
    }
});

updateDisplay();
