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
let userHistoryRaw = []; // ユーザーが打った手の「生の座標」を保存するための配列

// 盤面データ (8x8) 0:空, 1:黒, 2:白
let board = Array(8).fill().map(() => Array(8).fill(0));
let currentPlayer = 1; // 1: 黒, 2: 白

// 初期配置
board[3][3] = 2; // d4
board[4][4] = 2; // e4
board[3][4] = 1; // e5
board[4][3] = 1; // d5

let isGuideOn = false;

// 座標を標準形(f5始まり)に変換するための変数
let transformRule = null;

// 数値を棋譜形式(f5など)に変換する関数
function toKifu(x, y) {
    return cols[x] + (y + 1);
}

/**
 * 座標(x, y)を正規化して棋譜形式で返す
 */
function getNormalizedKifu(x, y) {
    if (userHistory.length === 0) {
        // 1手目の位置から変換ルールを決定する

        if (x === 5 && y === 4) {
            // f5 (そのまま)
            transformRule = (tx, ty) => ({nx: tx, ny: ty});
        } else if (x === 2 && y === 3) {
            // c4 (2,3)
            transformRule = (tx, ty) => ({nx: 7-tx, ny: 7-ty});
        } else if (x === 3 && y === 2) {
            // d3(3,2) -> f5(5,4)
            transformRule = (tx, ty) => ({nx: 7-ty, ny: 7-tx});  
        } else if (x === 4 && y === 5) {
            // e6 (4,5)
            transformRule = (tx, ty) => ({nx: ty, ny: tx}); 
        } else {
            transformRule = (tx, ty) => ({nx: tx, ny: ty});
        }
    }

    // ルールに従って変換
    const {nx, ny} = transformRule(x, y);
    return toKifu(nx, ny);
}

function toggleGuide() {
    isGuideOn = !isGuideOn;
    document.getElementById('guide-btn').innerText = `定石ガイド: ${isGuideOn ? 'ON' : 'OFF'}`;
    drawBoard(); // 再描画してガイドを表示/非表示にする
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
            square.style.position = 'relative'; // ガイドを中央に配置するため
            square.onclick = () => putStone(x, y);

            // --- 定石ガイドの表示ロジック ---
            if (isGuideOn && userHistory.length > 0) {
                const matches = findMatchingJoseki();
                if (matches.length > 0) {
                    // すべての該当する定石から「次の手」を抽出
                    const nextSteps = matches
                        .map(m => m.steps[userHistory.length])
                        .filter(step => step !== undefined);

                    // 重複を除去（同じ場所に複数の定石が重なる場合があるため）
                    const uniqueSteps = [...new Set(nextSteps)];

                    uniqueSteps.forEach(stepKifu => {
                        const guideCoord = getRealCoordinates(stepKifu);
                        if (guideCoord.rx === x && guideCoord.ry === y) {
                            const hint = document.createElement('div');
                            hint.className = 'guide-hint';
                            square.appendChild(hint);
                        }
                    });
                }
            }

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

    if (checkAndFlip(x, y, currentPlayer, true)) {
        board[y][x] = currentPlayer;

        // 【重要】正規化された棋譜を取得して履歴に保存
        const normalizedKifu = getNormalizedKifu(x, y);
        userHistory.push(normalizedKifu); 

        // 表示用には「生の手」を使いたいので、これまでの toKifu も残す
        const rawKifu = toKifu(x, y);
        userHistoryRaw.push(rawKifu); // 生の座標も保存しておく

        // 1. まず手番を仮に交代させる
        let nextPlayer = 3 - currentPlayer;
        
        // 2. 次のプレイヤーが置けるかチェック
        if (!canMove(nextPlayer)) {
            // 3. 次のプレイヤーが置けない場合、さらに現プレイヤーが置けるかチェック
            if (!canMove(currentPlayer)) {
                // 両者置けない ＝ 終局
                drawBoard();
                handleGameOver();
                return;
            } else {
                // 相手だけ置けない ＝ パス（手番は今のプレイヤーのまま）
                alert(`${nextPlayer === 1 ? '黒' : '白'}は置ける場所がないためパスです。`);
                // nextPlayer を更新せず、currentPlayer のまま続行
            }
        } else {
            // 相手が置けるなら、正式に手番交代
            currentPlayer = nextPlayer;
        }

        
        const nextPlayerName = (currentPlayer === 1) ? '黒' : '白';
        const matches = findMatchingJoseki();

        //定石完了アラート
        if (matches.length === 1) {
            const targetJoseki = matches[0];
            // ユーザーの手数と、その定石の全手数が一致したか判定
            if (userHistory.length === targetJoseki.steps.length) {
                // 少し遅らせてアラートを出すと、石が置かれたのを確認できる
                setTimeout(() => {
                    alert(`【定石完了】\n${targetJoseki.name}：全${targetJoseki.steps.length}手`);
                }, 100);
            }
        }

        // 表示用メッセージの作成
        let line01 = `${rawKifu} に置きました。次は ${nextPlayerName} です`;
        let line02 = matches.length > 0 ? 
            `【定石：${matches.map(m => m.name).join(', ')} （${userHistory.length}手目）】` : 
            `【定石外】`;

        statusElement.innerHTML = `${line01}<br>${line02}`;
        drawBoard();
    } else {
        alert("そこには置けません（相手の石を挟めません）");
    }
}

//「置ける場所があるか」判定
function canMove(color) {
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            // すでに石がある場所はスキップ
            if (board[y][x] !== 0) continue;
            
            // 1方向でもひっくり返せるなら、その色は「置ける場所がある」
            if (checkFlippable(x, y, color)) {
                return true;
            }
        }
    }
    return false;
}

function checkFlippable(startX, startY, color) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [ 0, -1],          [ 0, 1],
        [ 1, -1], [ 1, 0], [ 1, 1]
    ];
    const opponent = 3 - color;

    for (const [dy, dx] of directions) {
        let x = startX + dx;
        let y = startY + dy;
        let count = 0;

        while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] === opponent) {
            x += dx;
            y += dy;
            count++;
        }

        if (count > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] === color) {
            return true;
        }
    }
    return false;
}

//石の数を数える関数
function calculateScore() {
    let black = 0;
    let white = 0;

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (board[y][x] === 1) black++;
            if (board[y][x] === 2) white++;
        }
    }

    return { black, white };
}

function handleGameOver() {
    const score = calculateScore();
    let message = `ゲーム終了！\n黒: ${score.black}石\n白: ${score.white}石\n\n`;

    if (score.black > score.white) {
        message += "黒の勝ちです！";
    } else if (score.white > score.black) {
        message += "白の勝ちです！";
    } else {
        message += "引き分けです。";
    }

    // アラートで表示、または画面上の特定のエリアに表示
    alert(message);
    document.getElementById('status').innerText = "ゲーム終了";
}

/**
 * 定石データ(f5等)を、現在の回転状態に合わせた実際のx, yに変換する
 */
function getRealCoordinates(kifu) {
    const kX = cols.indexOf(kifu[0]);
    const kY = parseInt(kifu.slice(1)) - 1;

    /*
    // すべての座標(0-7, 0-7)をチェックして、
    // transformRuleを通した結果がkX, kYと一致する場所を探す
    for (let ry = 0; ry < 8; ry++) {
        for (let rx = 0; rx < 8; rx++) {
            const normalized = transformRule(rx, ry);
            if (normalized.nx === kX && normalized.ny === kY) {
                return { rx, ry };
            }
        }
    }
    return { rx: -1, ry: -1 };
    */

    // 2. 1手目の位置に基づいて、transformRuleと「逆」の計算を行う
    const firstMove = userHistoryRaw[0]; // 最初の1手(firstMove)の生の座標

    if (firstMove === "f5") {
        return { rx: kX, ry: kY }; // f5: そのまま (5,4)
    } else if (firstMove === "c4") {
        return { rx: 7 - kX, ry: 7 - kY }; // c4(2,3)
    } else if (firstMove === "d3") {
        return { rx: 7 - kY, ry: 7 - kX }; // d3(3,2)
    } else if (firstMove === "e6") {
        return { rx: kY, ry: kX }; // e6(4,5)
    }

    return { rx: -1, ry: -1 };
}

// 最初の描画
drawBoard();