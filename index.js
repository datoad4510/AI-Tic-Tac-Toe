const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3500;

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());

// this array will hold the output of cpp line by line,
// with each line split with spaces and trimmed
let stdoutArray = [];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/initial_parameters", (req, res) => {
    const params = req.body;
    console.log(params);
    fillInitialParams(params.player, params.difficulty);
    res.send(`Inserted parameters!`);
});

app.post("/coordinates", async (req, res) => {
    const coords = req.body;
    console.log(coords);
    if (JSON.stringify(coords) === "{}") {
        // the caller just wants coordinates
        await sleep(50);
        res.json(getCoords());
    } else {
        insertIntoBoard(coords.row, coords.col);
        // wait for 50ms for cpp to output cpu's move
        await sleep(50);
        res.json(getCoords());
    }
});

app.get("/child_scores", (req, res) => {
    res.send(getChildScores());
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

/* ! Code for running CPP process below */

const spawn = require("child_process").spawn;
// const exec = require("child_process").exec;


/*
console.log(env.PATH);

const CppApp = spawn("tic_tac_toe.out");

function getChildScores() {
    const latest = stdoutArray[stdoutArray.length - 1];
    let scores = [];
    let score_index = -1;

    // find where scores start
    for (let index = 0; index < latest.length; index++) {
        if (latest[index] === "Scores") {
            score_index = index;
            break;
        }
    }

    // get the scores
    for (let index = score_index + 1; index < latest.length; index++) {
        scores.push(latest[index]);
    }

    return scores;
}

// pipe std output of executable to the std output of the main process of nodejs
CppApp.stdout.pipe(process.stdout);

// end process when stdin descriptor closes
// without this, input will continue forever
CppApp.stdin.on("close", () => {
    // process.stdin.end();
    console.log(stdoutArray);
    process.exit();
});

// save stdout of exe file in the array line by line
CppApp.stdout.on("data", (chunk) => {
    let output = chunk.toString().trim();

    output = output.split(" ");

    for (let index = 0; index < output.length; index++) {
        output[index] = output[index].trim();
    }

    stdoutArray.push(output);

    console.log(stdoutArray);
});

// fill out player, difficulty and gamemode if the program is asking for them

function fillInitialParams(player, difficulty) {
    // if race condition happens, we can add a small delay
    CppApp.stdin.write(Buffer.from(`${player}\n`));
    CppApp.stdin.write(Buffer.from(`${difficulty}\n`));
}

function insertIntoBoard(row, col) {
    CppApp.stdin.write(Buffer.from(`${row}\n`));
    CppApp.stdin.write(Buffer.from(`${col}\n`));
    // getChildScores(stdoutArray[stdoutArray.length - 1]);
}

// get most recent coordinates
function getCoords() {
    const latest = stdoutArray[stdoutArray.length - 1];
    console.log("latest ", latest);
    console.log("full", stdoutArray);
    return {
        row: latest[1],
        col: latest[2],
    };
}

*/