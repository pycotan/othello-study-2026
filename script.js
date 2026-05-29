const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const josekiList = [
    { name: "野ウサギ", steps: ["f5", "d6", "c6", "f4", "e6", "g5", "f3", "e3"] },
    { name: "ラルウサギ", steps: ["f5", "d6", "c5", "f4", "e3", "c6", "d3", "f3", "e6"] },
    { name: "横ウサギ", steps: ["f5", "d6", "c5", "f4", "e3", "c6", "d3", "g5", "g4"] },
    { name: "金魚", steps: ["f5", "d6", "c3", "d3", "c4", "f4", "c5", "b3", "c2", "e6", "c6", "b4"] },
    { name: "ブライトウェル", steps: ["f5", "d6", "c3", "d3", "c4", "f4", "e3", "f3"] },
    { name: "リーダーズタイガー", steps: ["f5", "d6", "c3", "d3", "c4", "f4", "e6", "f6", "e3", "c5"] },
    { name: "コンポス", steps: ["f5", "d6", "c3", "d3", "c4", "f4", "f6", "f3", "e6", "e7", "d7", "g6"] },
    { name: "猫", steps: ["f5", "d6", "c4", "d3", "c5", "f4", "e3", "f3"] },
    { name: "羊", steps: ["f5", "d6", "c4", "d3", "e6", "f4", "e3", "f3"] },
    { name: "馬", steps: ["f5", "d6", "c5", "f4", "d3", "e3", "g4", "g3"] },
    { name: "Fローズ", steps: ["f5", "d6", "c5", "f4", "e3", "c6", "d3", "f6", "e6", "d7", "g4", "c4", "g5", "c3", "f7", "d2", "e7", "f2", "c8", "f3", "c7", "d8", "e8", "g3"] },
    { name: "野苺", steps: ["f5", "f6", "e6", "f4", "g5", "e7", "f7", "h5", "e8"] },
    { name: "ネズミ", steps: ["f5", "f4", "e3", "f6", "d3", "e2", "f2", "c5", "f1"] }
];

let userHistory = []; // ユーザーが打った手の履歴を保存用

// 盤面データ (8x8) 0:空, 1:黒, 2:白
let board = Array(8).fill().map(() => Array(8).fill(0));
let currentPlayer = 1; // 1: 黒, 2: 白

// 初期配置
board[3][3] = 2; // d4
board[4][4] = 2; // e4
board[3][4] = 1; // e5
board[4][3] = 1; // d5

// 数値を棋譜形式(f5など)に変換する関数
function toKifu(x, y) {
    return cols[x] + (y + 1);
}

// --- 関数追加：現在の履歴から該当する定石を探す ---
function findMatchingJoseki() {
    return josekiList.filter(j => {
        // ユーザーが打った手数分だけ、定石の出だしが一致するかチェック
        return userHistory.every((step, index) => step === j.steps[index]);
    });
}

// 石を置けるかチェックし、ひっくり返す関数
function checkAndFlip(startX, startY, color, doFlip) {
    const opponent = 3 - color; // 1なら2, 2なら1
    let canPlace = false;

    // 8方向のオフセット（dx, dy）
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    for (let [dx, dy] of directions) {
        let x = startX + dx;
        let y = startY + dy;
        let flippedPositions = [];

        // 隣が相手の石である間、進み続ける
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] === opponent) {
            flippedPositions.push([x, y]);
            x += dx;
            y += dy;
        }

        // 相手の石の先に自分の石があれば「挟んだ」ことになる
        if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] === color && flippedPositions.length > 0) {
            canPlace = true;
            if (doFlip) {
                for (let [fx, fy] of flippedPositions) {
                    board[fy][fx] = color; // ひっくり返す
                }
            }
        }
    }
    return canPlace;
}

// 盤面を描画する関数
function drawBoard() {
    boardElement.innerHTML = '';

    // 1. 左上の空白（0,0地点）
    const empty = document.createElement('div');
    empty.className = 'label';
    boardElement.appendChild(empty);

    // 2. 上端のラベル (a-h)
    for (let x = 0; x < 8; x++) {
        const label = document.createElement('div');
        label.className = 'label';
        label.innerText = cols[x];
        boardElement.appendChild(label);
    }

    // 3. 盤面本体 (行ラベル + 石)
    for (let y = 0; y < 8; y++) {
        // 左端の行ラベル (1-8)
        const label = document.createElement('div');
        label.className = 'label';
        label.innerText = y + 1;
        boardElement.appendChild(label);

        // その行の石を8マス分描画
        for (let x = 0; x < 8; x++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.onclick = () => putStone(x, y);

            if (board[y][x] !== 0) {
                const stone = document.createElement('div');
                stone.className = 'stone ' + (board[y][x] === 1 ? 'black' : 'white');
                square.appendChild(stone);
            }
            boardElement.appendChild(square);
        }
    }
}

// 石を置く関数
function putStone(x, y) {
    if (board[y][x] !== 0) return; // すでに石がある

    console.log(userHistory);

    // ルールに基づいて挟めるか確認
    if (checkAndFlip(x, y, currentPlayer, true)) {
        board[y][x] = currentPlayer;
        const kifu = toKifu(x, y);

        userHistory.push(kifu); // 履歴に追加

        const nextPlayerName = (currentPlayer === 1) ? '白' : '黒';
        const matches = findMatchingJoseki();

        // 1. 一行目のメッセージ
        let line01 = `${kifu} に置きました。次は ${nextPlayerName} です`;
        
        // 2. 二行目のメッセージ（定石判定）
        let line02 = "";

        // メッセージの更新
        if (matches.length > 0) {
            const names = matches.map(m => m.name).join(', ');
            line02 = `【定石：${names} （${userHistory.length}手目）】`;
        } else {
            line02 = `【定石外】`;
        }
        
        // 3. innerHTML を使って、<br> タグで改行して出力
        statusElement.innerHTML = `${line01}<br>${line02}`;

        // プレイヤー交代
        currentPlayer = 3 - currentPlayer;
        
        drawBoard();
    } else {
        alert("そこには置けません（相手の石を挟めません）");
    }
}

// 最初の描画
drawBoard();