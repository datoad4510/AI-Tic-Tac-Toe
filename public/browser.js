/*
TODO: refactor
*/

const server = "https://minimax-tic-tac-toe33.herokuapp.com";
// const server = "http://localhost:3500";

function getCoords(cell) {
    const cell_id = cell.id;
    const split_id = cell_id.split("_");
    const coords = split_id[1];

    const row = coords[0];
    const col = coords[1];

    return [row, col];
}

// true if the game has finished
let finished = false;
let player;
let cpu;
let hints_enabled = false;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function sendInitialParams(params) {
    const data = await fetch(`${server}/initial_parameters`, {
        method: "POST", // or 'PUT'
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    })
        .then((response) => response.text())
        .then((text) => {
            console.log(`${text}`);
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    // wait until tic-tac-toe tree is built
    await sleep(1000);
    return data;
}
async function sendCoords(params) {
    const data = await fetch(`${server}/coordinates`, {
        method: "POST", // or 'PUT'
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error("Error:", error);
        });
    console.log(data);
    return data;
}

async function getChildScores() {
    const data = await fetch(`${server}/child_scores`, {
        method: "GET",
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error("Error:", error);
        });
    console.log("logging data", data);
    return data;
}

async function killProcess() {
    const data = await fetch(`${server}/kill_process`, {
        method: "GET",
    })
        .then((response) => response.text())
        .then((text) => {
            console.log(text);
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function cleanBoard() {
    const children = document.querySelectorAll("#tic-tac-toe > div");
    for (let index = 0; index < children.length; index++) {
        const child = children[index];
        child.style.backgroundColor = "white";
        child.innerText = "";
    }
    finished = false;
}

window.onload = (e) => {
    let initial_parameter_container = document.getElementById(
        "initial-data-container"
    );
    let tic_tac_toe_container = document.getElementById(
        "tic-tac-toe-container"
    );
    let x_radio = document.getElementById("x");
    x_radio.checked = true;
    let slider = document.getElementById("myRange");
    let output = document.getElementById("value");
    let hint_checkbox = document.getElementById("hint-check");
    hint_checkbox.checked = true;
    output.innerText = slider.value; // Display the default slider value
    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function () {
        output.innerHTML = slider.value;
    };

    const again_button = document.getElementById("again-button");
    again_button.addEventListener("click", async (e) => {
        cleanBoard();
        const after_game_container = document.getElementById(
            "after-game-container"
        );
        after_game_container.classList.add("display-none");

        tic_tac_toe_container.classList.remove("slide-up-from-bottom");

        initial_parameter_container.classList.remove("display-none");

        await killProcess();
    });

    const submit = document.getElementById("submit-button");
    submit.addEventListener("click", async (e) => {
        player = x_radio.checked ? "X" : "O";
        cpu = x_radio.checked ? "O" : "X";
        hints_enabled = hint_checkbox.checked;
        const initial_parameters = {
            difficulty: slider.value,
            player: player,
        };

        await sendInitialParams(initial_parameters);

        // get first cpu move
        if (player == "O") {
            const first_coords = await sendCoords({});
            console.log(first_coords);
            addAiMove(first_coords);
            checkWinState();
            await colorCells();
        }

        // slide-up-from-bottom
        initial_parameter_container.classList.add("display-none");
        tic_tac_toe_container.classList.add("slide-up-from-bottom");
    });

    const cells = document.querySelectorAll("#tic-tac-toe > div");
    cells.forEach((cell) => {
        cell.addEventListener("click", async (e) => {
            if (cell.innerText == "") {
                cell.innerText = player;
                checkWinState();
                // player = player == "X" ? "O" : "X";
                const coords = getCoords(cell);
                const ai_coords = await sendCoords({
                    row: coords[0],
                    col: coords[1],
                });
                addAiMove(ai_coords);
                console.log(ai_coords);
                checkWinState();
                await colorCells();
            }
        });
    });
};

async function colorCells() {
    if (hints_enabled === false) return;
    const scores = await getChildScores();
    let score_index = 0;
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            const cell = document.querySelector("#cell_" + i + j);
            if (cell.innerText == "" && !finished) {
                let color;
                switch (parseInt(scores[score_index])) {
                    case -1:
                        color = "green";
                        break;
                    case 0:
                        color = "orange";
                        break;
                    case 1:
                        color = "red";
                        break;
                    default:
                        break;
                }
                cell.style.backgroundColor = color;
                ++score_index;
            } else {
                if (cell.style.backgroundColor != "turquoise")
                    cell.style.backgroundColor = "white";
            }
        }
    }
}

function addAiMove(ai_coords) {
    const suffix = "" + ai_coords.row + ai_coords.col;
    const cell = document.querySelector("#cell_" + suffix);
    cell.innerText = cpu;
}

function checkWinState() {
    let winning_side;

    let cell_matrix = [];
    for (let i = 1; i <= 3; i++) {
        cell_matrix.push([]);
        for (let j = 1; j <= 3; j++) {
            const cell = document.querySelector("#cell_" + i + j);
            cell_matrix[cell_matrix.length - 1].push(cell);
        }
    }
    // check diagonals, rows and columns
    // if innerText of each one is equal,
    // draw the corresponding line

    // horizontals
    for (let i = 0; i < cell_matrix.length; ++i) {
        let all_equal = true;
        for (let j = 1; j < cell_matrix[i].length; ++j) {
            if (cell_matrix[i][j].innerText === "") {
                all_equal = false;
                break;
            }
            if (cell_matrix[i][j].innerText != cell_matrix[i][j - 1].innerText)
                all_equal = false;
        }
        if (all_equal) {
            for (let j = 0; j < cell_matrix[i].length; ++j) {
                winning_side = cell_matrix[i][j].innerText;
                cell_matrix[i][j].style.backgroundColor = "turquoise";
            }

            finished = true;
        }
    }
    // verticals
    for (let j = 0; j < cell_matrix[0].length; ++j) {
        let all_equal = true;
        for (let i = 1; i < cell_matrix.length; ++i) {
            if (cell_matrix[i][j].innerText === "") {
                all_equal = false;
                break;
            }
            if (cell_matrix[i][j].innerText != cell_matrix[i - 1][j].innerText)
                all_equal = false;
        }
        if (all_equal) {
            for (let i = 0; i < cell_matrix.length; ++i) {
                winning_side = cell_matrix[i][j].innerText;
                cell_matrix[i][j].style.backgroundColor = "turquoise";
            }

            finished = true;
        }
    }

    // prime diagonal
    let all_equal = true;
    for (let i = 1; i < cell_matrix.length; ++i) {
        if (cell_matrix[i][i].innerText === "") {
            all_equal = false;
            break;
        }
        if (
            cell_matrix[i][i].innerText != cell_matrix[i - 1][i - 1].innerText
        ) {
            all_equal = false;
        }
    }
    if (all_equal) {
        for (let i = 0; i < cell_matrix.length; ++i) {
            winning_side = cell_matrix[i][i].innerText;
            cell_matrix[i][i].style.backgroundColor = "turquoise";
        }

        finished = true;
    }

    // skew diagonal
    all_equal = true;
    for (let i = 1; i < cell_matrix.length; ++i) {
        if (cell_matrix[i][cell_matrix.length - 1 - i].innerText === "") {
            all_equal = false;
            break;
        }
        if (
            cell_matrix[i][cell_matrix.length - 1 - i].innerText !=
            cell_matrix[i - 1][cell_matrix.length - i].innerText
        ) {
            all_equal = false;
        }
    }
    if (all_equal) {
        for (let i = 0; i < cell_matrix.length; ++i) {
            winning_side = cell_matrix[i][cell_matrix.length - 1 - i].innerText;
            cell_matrix[i][cell_matrix.length - 1 - i].style.backgroundColor =
                "turquoise";
        }

        finished = true;
    }

    // check if a tie
    let tie = true;
    for (let i = 0; i < cell_matrix.length; ++i) {
        for (let j = 0; j < cell_matrix[i].length; ++j) {
            if (cell_matrix[i][j].innerText === "") {
                tie = false;
            }
        }
    }
    if (tie) finished = true;

    if (finished) {
        // clean all non-turquoise backgrounds
        for (let i = 0; i < cell_matrix.length; ++i) {
            for (let j = 0; j < cell_matrix[i].length; ++j) {
                if (cell_matrix[i][j].style.backgroundColor !== "turquoise") {
                    cell_matrix[i][j].style.backgroundColor = "white";
                }
            }
        }

        // announce winner
        let message;
        if (tie) message = "It's a tie!";
        else if (player == winning_side) message = "You won!";
        else if (cpu == winning_side) message = "You lost :(";
        else {
            throw new Error();
        }

        const message_span = document.getElementById("message-span");
        message_span.innerText = message;

        const after_game_container = document.getElementById(
            "after-game-container"
        );
        after_game_container.classList.remove("display-none");
    }
}
