const output = document.getElementById("console");

function writeOutput(prefix, message) {
    const time = new Date().toLocaleTimeString();

    const line = document.createElement("div");
    line.className = "console-line";

    if (prefix.includes("ERROR")) {
        line.classList.add("console-error");
    }

    line.textContent = `[${time}] ${prefix} ${message}`;

    output.appendChild(line);

    setTimeout(() => {
        line.classList.add("fade-out");

        setTimeout(() => {
            line.remove();
        }, 5000);
    }, 10000);
}

function formatConsoleArg(arg) {
    if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
    }

    if (typeof arg === "object" && arg !== null) {
        try {
            return JSON.stringify(arg, null, 2);
        } catch {
            return String(arg);
        }
    }

    return String(arg);
}


// Capture console.log / warn / error / info
["log", "warn", "error", "info"].forEach(type => {
    const original = console[type];

    console[type] = function (...args) {
        original.apply(console, args);

        const message = args
            .map(formatConsoleArg)
            .join(" ");

        writeOutput(`[${type.toUpperCase()}]`, message);
    };
});


// Catch uncaught JavaScript errors
window.onerror = function (
    message,
    source,
    lineno,
    colno,
    error
) {
    const stack = error?.stack ||
        `${message}\n    at ${source}:${lineno}:${colno}`;

    writeOutput("[UNCAUGHT ERROR]", stack);

    return false;
};


// Catch unhandled Promise errors
window.addEventListener("unhandledrejection", event => {
    const error = event.reason;

    let message = "";

    if (error?.name) {
        message += `${error.name}: `;
    }

    if (error?.message) {
        message += error.message;
    } else {
        message += String(error);
    }

    if (error?.stack) {
        message += `\n${error.stack}`;
    }

    writeOutput("[UNHANDLED PROMISE ERROR]", message);
});