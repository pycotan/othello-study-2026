const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

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

    // ルールに基づいて挟めるか確認
    if (checkAndFlip(x, y, currentPlayer, true)) {
        board[y][x] = currentPlayer;
        const kifu = toKifu(x, y);
        
        // プレイヤー交代
        currentPlayer = 3 - currentPlayer;
        statusElement.innerText = `${kifu} に置きました。次は ${currentPlayer === 1 ? '黒' : '白'} です`;
        drawBoard();
    } else {
        alert("そこには置けません（相手の石を挟めません）");
    }
}

// 最初の描画
drawBoard();