const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// 盤面データ (8x8) 0:空, 1:黒, 2:白
let board = Array(8).fill().map(() => Array(8).fill(0));

// 初期配置
board[3][3] = 2; // d4
board[4][4] = 2; // e4
board[3][4] = 1; // e5
board[4][3] = 1; // d5

// 数値を棋譜形式(f5など)に変換する関数
function toKifu(x, y) {
    return cols[x] + (y + 1);
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

    const kifu = toKifu(x, y);
    console.log("置いた場所: " + kifu);

    // 現状はクリックした場所に黒石を置くだけ（判定ロジックは今後追加）
    board[y][x] = 1;
    statusElement.innerText = "打った手: " + kifu;
    drawBoard();
}

// 最初の描画
drawBoard();