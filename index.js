const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3500;

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());

const spawn = require("child_process").spawn;

let processMap = {};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/initial_parameters", (req, res) => {
    const CppApp = spawn("./tic_tac_toe.out");
    // const CppApp = spawn("full tic tac toe.exe");
    console.log(`starting child ${CppApp.pid}`);

    // stdoutArray will hold the output of cpp line by line,
    // with each line split with spaces and trimmed
    processMap[`${CppApp.pid}`] = {
        child_process: CppApp,
        stdoutArray: [],
    };

    // pipe std output of executable to the std output of the main process of nodejs so we can see
    // what it's outputting
    processMap[`${CppApp.pid}`].child_process.stdout.pipe(process.stdout);

    // end process when stdin descriptor closes
    // without this, input will continue forever
    // CppApp.stdin.on("close", () => {
    //     // process.stdin.end();
    //     console.log(stdoutArray);
    //     process.exit();
    // });

    // save stdout of exe file in the array line by line
    processMap[`${CppApp.pid}`].child_process.stdout.on("data", (chunk) => {
        let output = chunk.toString().trim();

        output = output.split(" ");

        for (let index = 0; index < output.length; index++) {
            output[index] = output[index].trim();
        }

        processMap[`${CppApp.pid}`].stdoutArray.push(output);

        // console.log(processMap[`${CppApp.pid}`].stdoutArray);
    });

    const params = req.body;
    console.log(`parameters of ${CppApp.pid}`, params);
    fillInitialParams(params.player, params.difficulty, CppApp.pid);

    res.send(`${CppApp.pid}`);
});

app.post("/coordinates", async (req, res) => {
    console.log(`got move for ${req.body.id}`, req.body.coordinates);
    const coords = req.body.coordinates;
    const id = req.body.id;
    if (JSON.stringify(coords) === "{}") {
        // the caller just wants coordinates
        await sleep(50);
        res.json(getCoords(id));
    } else {
        insertIntoBoard(coords.row, coords.col, id);
        // wait for 50ms for cpp to output cpu's move
        await sleep(50);
        res.json(getCoords(id));
    }
});

app.post("/kill_process", (req, res) => {
    const id = req.body.id;
    const CppApp = processMap[`${id}`].child_process;
    CppApp.stdin.pause();
    CppApp.kill("SIGKILL");
    res.send(`killed child ${id}`);
});

app.post("/child_scores", (req, res) => {
    // console.log("child scores request", req.body);
    res.send(getChildScores(req.body.id));
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

/* ! Code for running CPP process below */

function getChildScores(id) {
    const stdoutArray = processMap[`${id}`].stdoutArray;
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

// fill out player, difficulty and gamemode if the program is asking for them

function fillInitialParams(player, difficulty, id) {
    // if race condition happens, we can add a small delay
    const CppApp = processMap[`${id}`].child_process;

    CppApp.stdin.write(Buffer.from(`${player}\n`));
    CppApp.stdin.write(Buffer.from(`${difficulty}\n`));
}

function insertIntoBoard(row, col, id) {
    const CppApp = processMap[`${id}`].child_process;

    CppApp.stdin.write(Buffer.from(`${row}\n`));
    CppApp.stdin.write(Buffer.from(`${col}\n`));
    // getChildScores(stdoutArray[stdoutArray.length - 1]);
}

// get most recent coordinates
function getCoords(id) {
    console.log(`getting coordinates of id ${id}`);
    const stdoutArray = processMap[`${id}`].stdoutArray;

    const latest = stdoutArray[stdoutArray.length - 1];
    // console.log("latest ", latest);
    // console.log("full", stdoutArray);
    return {
        row: latest[1],
        col: latest[2],
    };
}
