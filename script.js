// 中国象棋游戏类
class ChineseChess {
    constructor() {
        this.canvas = document.getElementById('chess-board');
        this.ctx = this.canvas.getContext('2d');
        this.moveList = document.getElementById('move-list');
        this.startButton = document.getElementById('start-game');
        this.undoButton = document.getElementById('undo-move');

        // 难度设置按钮
        this.difficultyMediumButton = document.getElementById('difficulty-medium');
        this.difficultyHardButton = document.getElementById('difficulty-hard');
        this.difficultyExpertButton = document.getElementById('difficulty-expert');

        // 棋盘参数
        this.cellSize = 65; // 增大格子尺寸
        this.gridWidth = 8 * this.cellSize; // 8个格子宽度
        this.gridHeight = 9 * this.cellSize; // 9个格子高度
        this.boardWidth = this.gridWidth + 120; // 添加更多边距
        this.boardHeight = this.gridHeight + 120; // 添加更多边距
        this.margin = 60; // 边距

        // 游戏状态
        this.gameStarted = false;
        this.currentPlayer = 'black'; // 电脑先走
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.gameEvents = []; // 存储游戏事件（如"游戏开始"）
        this.isCheck = false;
        this.isCheckmate = false;
        this.pieces = []; // 存储所有棋子对象
        this.isPlayerTurn = false; // AI先走
        this.computerThinking = false; // 电脑思考中

        // 难度设置 (默认中等难度)
        this.gameDifficulty = 'medium';

        // AI Worker相关
        this.aiWorker = null;
        this.aiWorkerUrl = null; // 保存Worker URL以便清理
        this.currentJobId = 0;
        this.pendingJob = null;

        // 悔棋相关
        this.isUndoing = false;

        // 资源管理
        this.blobUrls = new Set(); // 跟踪所有创建的Blob URL

        // 性能优化
        this.renderScheduled = false;
        this.validMovesCache = new Map(); // 缓存有效移动计算

        // DOM缓存
        this.domCache = {};

        // Toast单例
        this.currentToast = null;
        this.toastTimer = null;

        this.initCanvas();
        this.initBoard();
        this.initAIWorker();
        this.initEventListeners();
        this.cacheDOMElements();
    }

    // 初始化AI Worker (使用Blob URL解决file://协议问题)
    initAIWorker() {
        try {
            // AI Worker代码（内联方式）
            const workerCode = `
// AI思考Worker - 独立线程处理AI计算
class ChineseChessAI {
    constructor() {
        this.pieceValues = {
            '將': 10000, '帥': 10000,
            '車': 90, '馬': 40, '炮': 45, '砲': 45, '象': 20, '士': 20, '相': 20, '仕': 20,
            '卒': 10, '兵': 10
        };

        this.positionValues = {
            '車': [
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ],
            '馬': [
                [0,  0, 20,  0,  0,  0, 20,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [18, 0,  0,  0,  0,  0,  0,  0, 18],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [18, 0,  0,  0,  0,  0,  0,  0, 18],
                [0,  0, 20,  0,  0,  0, 20,  0,  0]
            ],
            '炮': [
                [100, 100,  96,  91,  90,  91,  96, 100, 100],
                [ 98,  98,  96,  92,  89,  92,  96,  98,  98],
                [ 97,  97,  96,  91,  92,  91,  96,  97,  97],
                [ 96,  99,  99,  98, 100,  98,  99,  99,  96],
                [ 96,  96,  96,  96, 100,  96,  96,  96,  96],
                [ 95,  96,  99,  96, 100,  96,  99,  96,  95],
                [ 96,  96,  96,  96,  96,  96,  96,  96,  96],
                [ 97,  96, 100,  99, 101,  99, 100,  96,  97],
                [ 96,  97,  98,  98,  98,  98,  98,  97,  96],
                [ 96,  96,  97,  99,  99,  99,  97,  96,  96]
            ],
            '卒': [
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [ 9,  9,  9,  9,  9,  9,  9,  9,  9],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [14, 14, 14, 14, 14, 14, 14, 14, 14],
                [21, 21, 21, 21, 21, 21, 21, 21, 21],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [28, 28, 28, 28, 28, 28, 28, 28, 28],
                [42, 42, 42, 42, 42, 42, 42, 42, 42],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0]
            ]
        };
    }

    // 复制棋子状态
    clonePieces(pieces) {
        return pieces.map(piece => ({...piece}));
    }

    // 获取指定位置的棋子
    getPieceAt(pieces, x, y) {
        return pieces.find(piece => piece.x === x && piece.y === y);
    }

    
    // 各种棋子移动规则
    isValidGeneralMove(pieces, fromX, fromY, toX, toY, color) {
        if (color === 'red') {
            if (toX < 3 || toX > 5 || toY < 7 || toY > 9) return false;
        } else {
            if (toX < 3 || toX > 5 || toY < 0 || toY > 2) return false;
        }
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        return deltaX + deltaY === 1;
    }

    isValidAdvisorMove(pieces, fromX, fromY, toX, toY, color) {
        if (color === 'red') {
            if (toX < 3 || toX > 5 || toY < 7 || toY > 9) return false;
        } else {
            if (toX < 3 || toX > 5 || toY < 0 || toY > 2) return false;
        }
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        return deltaX === 1 && deltaY === 1;
    }

    isValidElephantMove(pieces, fromX, fromY, toX, toY, color) {
        if (color === 'red' && toY < 5) return false;
        if (color === 'black' && toY > 4) return false;
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        if (deltaX !== 2 || deltaY !== 2) return false;
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        return !this.getPieceAt(pieces, midX, midY);
    }

    isValidHorseMove(pieces, fromX, fromY, toX, toY) {
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        if (!((deltaX === 1 && deltaY === 2) || (deltaX === 2 && deltaY === 1))) return false;
        if (deltaX === 2) {
            const blockX = fromX + (toX > fromX ? 1 : -1);
            return !this.getPieceAt(pieces, blockX, fromY);
        } else {
            const blockY = fromY + (toY > fromY ? 1 : -1);
            return !this.getPieceAt(pieces, fromX, blockY);
        }
    }

    isValidChariotMove(pieces, fromX, fromY, toX, toY) {
        if (fromX !== toX && fromY !== toY) return false;
        if (fromX === toX) {
            const minY = Math.min(fromY, toY);
            const maxY = Math.max(fromY, toY);
            for (let y = minY + 1; y < maxY; y++) {
                if (this.getPieceAt(pieces, fromX, y)) return false;
            }
        } else {
            const minX = Math.min(fromX, toX);
            const maxX = Math.max(fromX, toX);
            for (let x = minX + 1; x < maxX; x++) {
                if (this.getPieceAt(pieces, x, fromY)) return false;
            }
        }
        return true;
    }

    isValidCannonMove(pieces, fromX, fromY, toX, toY) {
        if (fromX !== toX && fromY !== toY) return false;
        let pieceCount = 0;
        if (fromX === toX) {
            const minY = Math.min(fromY, toY);
            const maxY = Math.max(fromY, toY);
            for (let y = minY + 1; y < maxY; y++) {
                if (this.getPieceAt(pieces, fromX, y)) pieceCount++;
            }
        } else {
            const minX = Math.min(fromX, toX);
            const maxX = Math.max(fromX, toX);
            for (let x = minX + 1; x < maxX; x++) {
                if (this.getPieceAt(pieces, x, fromY)) pieceCount++;
            }
        }
        const targetPiece = this.getPieceAt(pieces, toX, toY);
        return targetPiece ? pieceCount === 1 : pieceCount === 0;
    }

    isValidSoldierMove(pieces, fromX, fromY, toX, toY, color) {
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        if (deltaX + deltaY !== 1) return false;
        if (color === 'red') {
            if (fromY <= 4) {
                return (toY === fromY - 1) || (toY === fromY && deltaX === 1);
            } else {
                return toY === fromY - 1 && deltaX === 0;
            }
        } else {
            if (fromY >= 5) {
                return (toY === fromY + 1) || (toY === fromY && deltaX === 1);
            } else {
                return toY === fromY + 1 && deltaX === 0;
            }
        }
    }

    // 检查是否会导致将帅照面
    wouldCauseFacing(pieces, movingPiece, fromX, fromY, toX, toY) {
        movingPiece.x = toX;
        movingPiece.y = toY;

        const redGeneral = pieces.find(p => p.color === 'red' && (p.type === '帥'));
        const blackGeneral = pieces.find(p => p.color === 'black' && (p.type === '將'));

        let wouldFace = false;
        if (redGeneral && blackGeneral && redGeneral.x === blackGeneral.x) {
            let blocked = false;
            const minY = Math.min(redGeneral.y, blackGeneral.y);
            const maxY = Math.max(redGeneral.y, blackGeneral.y);
            for (let y = minY + 1; y < maxY; y++) {
                if (this.getPieceAt(pieces, redGeneral.x, y)) {
                    blocked = true;
                    break;
                }
            }
            wouldFace = !blocked;
        }

        movingPiece.x = fromX;
        movingPiece.y = fromY;
        return wouldFace;
    }

    // 检查移动是否合法
    isValidMove(pieces, piece, fromX, fromY, toX, toY) {
        const pieceType = piece.type;
        const pieceColor = piece.color;

        if (toX < 0 || toX > 8 || toY < 0 || toY > 9) return false;

        const targetPiece = this.getPieceAt(pieces, toX, toY);
        if (targetPiece && targetPiece.color === pieceColor) return false;

        let basicMoveValid = false;
        switch (pieceType) {
            case '將': case '帥':
                basicMoveValid = this.isValidGeneralMove(pieces, fromX, fromY, toX, toY, pieceColor);
                break;
            case '士': case '仕':
                basicMoveValid = this.isValidAdvisorMove(pieces, fromX, fromY, toX, toY, pieceColor);
                break;
            case '象': case '相':
                basicMoveValid = this.isValidElephantMove(pieces, fromX, fromY, toX, toY, pieceColor);
                break;
            case '馬':
                basicMoveValid = this.isValidHorseMove(pieces, fromX, fromY, toX, toY);
                break;
            case '車':
                basicMoveValid = this.isValidChariotMove(pieces, fromX, fromY, toX, toY);
                break;
            case '砲': case '炮':
                basicMoveValid = this.isValidCannonMove(pieces, fromX, fromY, toX, toY);
                break;
            case '卒': case '兵':
                basicMoveValid = this.isValidSoldierMove(pieces, fromX, fromY, toX, toY, pieceColor);
                break;
            default: return false;
        }

        if (!basicMoveValid) return false;
        return !this.wouldCauseFacing(pieces, piece, fromX, fromY, toX, toY);
    }

    // 评估局势
    evaluatePosition(pieces) {
        let score = 0;
        for (const piece of pieces) {
            const baseValue = this.pieceValues[piece.type] || 0;
            let positionValue = 0;

            const posKey = piece.type === '車' ? '車' :
                         piece.type === '馬' ? '馬' :
                         piece.type === '炮' || piece.type === '砲' ? '炮' :
                         piece.type === '卒' || piece.type === '兵' ? '卒' : null;

            if (posKey && this.positionValues[posKey]) {
                if (piece.color === 'black') {
                    positionValue = this.positionValues[posKey][piece.y][piece.x];
                } else {
                    positionValue = this.positionValues[posKey][9 - piece.y][piece.x];
                }
            }

            const totalValue = baseValue + positionValue;
            score += piece.color === 'black' ? totalValue : -totalValue;
        }
        return score;
    }

    // Minimax算法
    minimax(pieces, depth, currentPlayer, alpha, beta) {
        if (depth === 0) {
            return this.evaluatePosition(pieces);
        }

        const currentPieces = pieces.filter(piece => piece.color === currentPlayer);

        if (currentPlayer === 'black') {
            let maxScore = -Infinity;
            for (const piece of currentPieces) {
                for (let toX = 0; toX <= 8; toX++) {
                    for (let toY = 0; toY <= 9; toY++) {
                        if (this.isValidMove(pieces, piece, piece.x, piece.y, toX, toY)) {
                            const piecesCopy = this.clonePieces(pieces);
                            const movingPiece = piecesCopy.find(p =>
                                p.x === piece.x && p.y === piece.y && p.type === piece.type
                            );
                            const targetPiece = this.getPieceAt(piecesCopy, toX, toY);

                            movingPiece.x = toX;
                            movingPiece.y = toY;
                            if (targetPiece) {
                                const index = piecesCopy.indexOf(targetPiece);
                                piecesCopy.splice(index, 1);
                            }

                            const score = this.minimax(piecesCopy, depth - 1, 'red', alpha, beta);

                            maxScore = Math.max(maxScore, score);
                            alpha = Math.max(alpha, score);
                            if (beta <= alpha) return maxScore;
                        }
                    }
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const piece of currentPieces) {
                for (let toX = 0; toX <= 8; toX++) {
                    for (let toY = 0; toY <= 9; toY++) {
                        if (this.isValidMove(pieces, piece, piece.x, piece.y, toX, toY)) {
                            const piecesCopy = this.clonePieces(pieces);
                            const movingPiece = piecesCopy.find(p =>
                                p.x === piece.x && p.y === piece.y && p.type === piece.type
                            );
                            const targetPiece = this.getPieceAt(piecesCopy, toX, toY);

                            movingPiece.x = toX;
                            movingPiece.y = toY;
                            if (targetPiece) {
                                const index = piecesCopy.indexOf(targetPiece);
                                piecesCopy.splice(index, 1);
                            }

                            const score = this.minimax(piecesCopy, depth - 1, 'black', alpha, beta);

                            minScore = Math.min(minScore, score);
                            beta = Math.min(beta, score);
                            if (beta <= alpha) return minScore;
                        }
                    }
                }
            }
            return minScore;
        }
    }

    // 寻找最佳走法
    findBestMove(pieces, color, depth, moveHistory, gameDifficulty) {
        const validMoves = [];
        const currentPieces = pieces.filter(piece => piece.color === color);

        for (const piece of currentPieces) {
            for (let toX = 0; toX <= 8; toX++) {
                for (let toY = 0; toY <= 9; toY++) {
                    if (this.isValidMove(pieces, piece, piece.x, piece.y, toX, toY)) {
                        const piecesCopy = this.clonePieces(pieces);
                        const movingPiece = piecesCopy.find(p =>
                            p.x === piece.x && p.y === piece.y && p.type === piece.type
                        );
                        const targetPiece = this.getPieceAt(piecesCopy, toX, toY);

                        movingPiece.x = toX;
                        movingPiece.y = toY;
                        if (targetPiece) {
                            const index = piecesCopy.indexOf(targetPiece);
                            piecesCopy.splice(index, 1);
                        }

                        const score = this.minimax(piecesCopy, depth - 1, color === 'black' ? 'red' : 'black', -Infinity, Infinity);

                        validMoves.push({
                            score: score,
                            move: {
                                pieceIndex: pieces.findIndex(p =>
                                    p.x === piece.x && p.y === piece.y && p.type === piece.type
                                ),
                                fromX: piece.x,
                                fromY: piece.y,
                                toX: toX,
                                toY: toY
                            }
                        });
                    }
                }
            }
        }

        if (validMoves.length === 0) return null;

        // 开局阶段使用特殊策略
        if (moveHistory.length <= 5) {
            return this.selectOpeningMove(validMoves, color, moveHistory, pieces);
        }

        return this.selectMoveWithRandomness(validMoves, color, gameDifficulty, moveHistory);
    }

    selectOpeningMove(validMoves, color, moveHistory, pieces) {
        const piecePriority = {
            '砲': 5, '炮': 5,
            '馬': 4,
            '卒': 3, '兵': 3,
            '車': 2,
            '象': 1, '相': 1,
            '士': 1, '仕': 1,
            '將': 0, '帥': 0
        };

        validMoves.sort((a, b) => {
            const moveAPiece = pieces[a.move.pieceIndex];
            const moveBPiece = pieces[b.move.pieceIndex];
            const priorityA = piecePriority[moveAPiece.type] || 0;
            const priorityB = piecePriority[moveBPiece.type] || 0;

            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }

            if (color === 'black') {
                return b.score - a.score;
            } else {
                return a.score - b.score;
            }
        });

        const moveHistoryLength = moveHistory.length;
        let randomRange;

        if (moveHistoryLength <= 1) {
            randomRange = Math.min(8, validMoves.length);
        } else if (moveHistoryLength <= 3) {
            randomRange = Math.min(5, validMoves.length);
        } else {
            randomRange = Math.min(3, validMoves.length);
        }

        const selectedIndex = Math.floor(Math.random() * randomRange);
        return validMoves[selectedIndex].move;
    }

    selectMoveWithRandomness(validMoves, color, gameDifficulty, moveHistory) {
        validMoves.sort((a, b) => {
            if (color === 'black') {
                return b.score - a.score;
            } else {
                return a.score - b.score;
            }
        });

        const randomnessMap = {
            'easy': 0.8,
            'medium': 0.4,
            'hard': 0.15,
            'expert': 0.05
        };

        let baseRandomness = randomnessMap[gameDifficulty] || randomnessMap['medium'];
        const moveCount = moveHistory ? moveHistory.length : 0;

        if (moveCount <= 2) {
            baseRandomness = Math.min(1.0, baseRandomness + 0.4);
        } else if (moveCount <= 5) {
            baseRandomness = Math.min(1.0, baseRandomness + 0.2);
        }

        const maxIndex = Math.min(
            Math.floor(validMoves.length * baseRandomness),
            validMoves.length - 1
        );

        if (maxIndex === 0 || Math.random() > baseRandomness) {
            return validMoves[0].move;
        }

        const selectedIndex = Math.floor(Math.random() * (maxIndex + 1));
        return validMoves[selectedIndex].move;
    }
}

const ai = new ChineseChessAI();

self.addEventListener('message', function(e) {
    const { type, data } = e.data;

    if (type === 'calculate') {
        const { pieces, color, depth, moveHistory, gameDifficulty, jobId } = data;

        try {
            const bestMove = ai.findBestMove(pieces, color, depth, moveHistory, gameDifficulty);

            self.postMessage({
                type: 'result',
                data: { bestMove, jobId }
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                data: { error: error.message, jobId }
            });
        }
    } else if (type === 'interrupt') {
        self.postMessage({
            type: 'interrupted',
            data: { jobId: data.jobId }
        });
    }
});
`;

            // 创建Blob URL
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);

            // 创建Worker
            this.aiWorker = new Worker(workerUrl);

            // 保存URL以便后续清理
            this.aiWorkerUrl = workerUrl;

            this.aiWorker.addEventListener('message', (e) => {
                const { type, data } = e.data;

                if (type === 'result' && data.jobId === this.currentJobId) {
                    this.handleAIResult(data.bestMove);
                } else if (type === 'error' && data.jobId === this.currentJobId) {
                    this.handleAIError(data.error);
                }
            });

            this.aiWorker.addEventListener('error', (e) => {
                console.error('AI Worker error:', e);
                this.computerThinking = false;
                this.showMessage('AI计算出现错误，请重新开始');
            });

            console.log('AI Worker初始化成功 (使用Blob URL)');
        } catch (error) {
            console.error('Failed to initialize AI Worker:', error);
            this.computerThinking = false;
            this.showMessage('AI初始化失败，将使用简化模式');
        }
    }

    // 处理AI计算结果
    handleAIResult(bestMove) {
        this.computerThinking = false;
        this.pendingJob = null;

        // 更新按钮状态
        this.updateButtonStates();

        if (bestMove) {
            this.executeComputerMove(bestMove);
        } else {
            this.hideAIThinkingMessage();
            this.showMessage('AI无法找到合适的走法');
        }
    }

    // 处理AI计算错误
    handleAIError(error) {
        this.computerThinking = false;
        this.pendingJob = null;

        // 隐藏AI思考消息
        this.hideAIThinkingMessage();

        // 更新按钮状态
        this.updateButtonStates();

        console.error('AI calculation error:', error);
        this.showMessage('AI计算出现错误');
    }

    // 更新按钮状态
    updateButtonStates() {
        // 更新悔棋按钮状态
        if (this.undoButton) {
            this.undoButton.disabled = this.computerThinking || this.isUndoing || !this.gameStarted;
        }

        // 更新开始游戏按钮状态（根据游戏状态改变文本）
        if (this.startButton) {
            if (this.gameStarted) {
                this.startButton.textContent = '重新开始';
                this.startButton.disabled = false;
            } else {
                this.startButton.textContent = '开始游戏';
                this.startButton.disabled = false;
            }
        }
    }

    // 中断AI计算
    interruptAI() {
        if (this.aiWorker && this.pendingJob) {
            this.aiWorker.postMessage({
                type: 'interrupt',
                data: { jobId: this.currentJobId }
            });
            this.computerThinking = false;
            this.pendingJob = null;
        }
    }

    // 清理AI Worker资源
    cleanupAIWorker() {
        if (this.aiWorker) {
            this.aiWorker.terminate();
            this.aiWorker = null;
        }
        if (this.aiWorkerUrl) {
            URL.revokeObjectURL(this.aiWorkerUrl);
            this.aiWorkerUrl = null;
        }
    }

    // 清理所有Blob URL资源
    cleanupBlobUrls() {
        this.blobUrls.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('Failed to revoke blob URL:', url, e);
            }
        });
        this.blobUrls.clear();
    }

    // 缓存DOM元素
    cacheDOMElements() {
        this.domCache = {
            moveList: document.getElementById('move-list'),
            redPlayerStatus: document.getElementById('red-player-status'),
            blackPlayerStatus: document.getElementById('black-player-status'),
            difficultyLevel: document.getElementById('difficulty-level'),
            undoButton: document.getElementById('undo-move'),
            startButton: document.getElementById('start-game'),
            difficultyMediumButton: document.getElementById('difficulty-medium'),
            difficultyHardButton: document.getElementById('difficulty-hard'),
            difficultyExpertButton: document.getElementById('difficulty-expert')
        };
    }

    // 初始化Canvas
    initCanvas() {
        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;

        // 设置Canvas样式
        this.canvas.style.width = this.boardWidth + 'px';
        this.canvas.style.height = this.boardHeight + 'px';

        // 开启抗锯齿
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    // 初始化棋盘
    initBoard() {
        this.createPieces();
        this.render(); // 统一渲染方法
    }

    // 使用Canvas绘制棋盘
    drawBoard() {
        const ctx = this.ctx;

        // 清空画布
        ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

        // 绘制简约棋盘背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);

        // 绘制简约边框
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, this.boardWidth - 20, this.boardHeight - 20);

        // 设置线条样式
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 计算棋盘在Canvas中的起始位置，使其居中
        const boardStartX = (this.boardWidth - this.gridWidth) / 2;
        const boardStartY = (this.boardHeight - this.gridHeight) / 2;

        // 绘制横线（10条）
        for (let i = 0; i < 10; i++) {
            const y = boardStartY + i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(boardStartX, y);
            ctx.lineTo(boardStartX + this.gridWidth, y);
            ctx.stroke();
        }

        // 绘制竖线（9条）
        for (let i = 0; i < 9; i++) {
            const x = boardStartX + i * this.cellSize;

            // 左右边缘的竖线完整绘制
            if (i === 0 || i === 8) {
                ctx.beginPath();
                ctx.moveTo(x, boardStartY);
                ctx.lineTo(x, boardStartY + this.gridHeight);
                ctx.stroke();
            } else {
                // 中间的竖线在楚河汉界处断开
                // 上半部分
                ctx.beginPath();
                ctx.moveTo(x, boardStartY);
                ctx.lineTo(x, boardStartY + 4 * this.cellSize);
                ctx.stroke();

                // 下半部分
                ctx.beginPath();
                ctx.moveTo(x, boardStartY + 5 * this.cellSize);
                ctx.lineTo(x, boardStartY + this.gridHeight);
                ctx.stroke();
            }
        }

        // 绘制九宫格斜线
        // 上方九宫格
        ctx.beginPath();
        ctx.moveTo(boardStartX + 3 * this.cellSize, boardStartY);
        ctx.lineTo(boardStartX + 5 * this.cellSize, boardStartY + 2 * this.cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(boardStartX + 5 * this.cellSize, boardStartY);
        ctx.lineTo(boardStartX + 3 * this.cellSize, boardStartY + 2 * this.cellSize);
        ctx.stroke();

        // 下方九宫格
        ctx.beginPath();
        ctx.moveTo(boardStartX + 3 * this.cellSize, boardStartY + 7 * this.cellSize);
        ctx.lineTo(boardStartX + 5 * this.cellSize, boardStartY + 9 * this.cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(boardStartX + 5 * this.cellSize, boardStartY + 7 * this.cellSize);
        ctx.lineTo(boardStartX + 3 * this.cellSize, boardStartY + 9 * this.cellSize);
        ctx.stroke();

        // 绘制楚河汉界文字
        this.drawRiverText();

        // 绘制交叉点装饰
        this.drawIntersectionPoints();
    }

    // 绘制简约交叉点装饰
    drawIntersectionPoints() {
        const ctx = this.ctx;
        ctx.fillStyle = '#d0d0d0';

        // 计算棋盘在Canvas中的起始位置
        const boardStartX = (this.boardWidth - this.gridWidth) / 2;
        const boardStartY = (this.boardHeight - this.gridHeight) / 2;

        // 在重要的交叉点绘制小圆点装饰
        const importantPoints = [
            { x: 3, y: 3 }, { x: 5, y: 3 }, // 上方九宫格
            { x: 3, y: 6 }, { x: 5, y: 6 }, // 下方九宫格
        ];

        importantPoints.forEach(point => {
            const x = boardStartX + point.x * this.cellSize;
            const y = boardStartY + point.y * this.cellSize;

            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 绘制楚河汉界文字
    drawRiverText() {
        const ctx = this.ctx;
        ctx.save();

        // 计算棋盘在Canvas中的起始位置
        const boardStartX = (this.boardWidth - this.gridWidth) / 2;
        const boardStartY = (this.boardHeight - this.gridHeight) / 2;

        // 设置简约文字样式
        ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 楚河
        ctx.fillText('楚河', boardStartX + 2 * this.cellSize, boardStartY + 4.5 * this.cellSize);

        // 汉界
        ctx.fillText('汉界', boardStartX + 6 * this.cellSize, boardStartY + 4.5 * this.cellSize);

        ctx.restore();
    }

    // 创建棋子
    createPieces() {
        // 棋子初始位置定义
        this.initialPieces = [
            // 红方棋子（下方）
            { type: '車', color: 'red', x: 0, y: 9 },
            { type: '車', color: 'red', x: 8, y: 9 },
            { type: '馬', color: 'red', x: 1, y: 9 },
            { type: '馬', color: 'red', x: 7, y: 9 },
            { type: '相', color: 'red', x: 2, y: 9 },
            { type: '相', color: 'red', x: 6, y: 9 },
            { type: '仕', color: 'red', x: 3, y: 9 },
            { type: '仕', color: 'red', x: 5, y: 9 },
            { type: '帥', color: 'red', x: 4, y: 9 },
            { type: '炮', color: 'red', x: 1, y: 7 },
            { type: '炮', color: 'red', x: 7, y: 7 },
            { type: '兵', color: 'red', x: 0, y: 6 },
            { type: '兵', color: 'red', x: 2, y: 6 },
            { type: '兵', color: 'red', x: 4, y: 6 },
            { type: '兵', color: 'red', x: 6, y: 6 },
            { type: '兵', color: 'red', x: 8, y: 6 },

            // 黑方棋子（上方）
            { type: '車', color: 'black', x: 0, y: 0 },
            { type: '車', color: 'black', x: 8, y: 0 },
            { type: '馬', color: 'black', x: 1, y: 0 },
            { type: '馬', color: 'black', x: 7, y: 0 },
            { type: '象', color: 'black', x: 2, y: 0 },
            { type: '象', color: 'black', x: 6, y: 0 },
            { type: '士', color: 'black', x: 3, y: 0 },
            { type: '士', color: 'black', x: 5, y: 0 },
            { type: '將', color: 'black', x: 4, y: 0 },
            { type: '砲', color: 'black', x: 1, y: 2 },
            { type: '砲', color: 'black', x: 7, y: 2 },
            { type: '卒', color: 'black', x: 0, y: 3 },
            { type: '卒', color: 'black', x: 2, y: 3 },
            { type: '卒', color: 'black', x: 4, y: 3 },
            { type: '卒', color: 'black', x: 6, y: 3 },
            { type: '卒', color: 'black', x: 8, y: 3 }
        ];

        // 创建棋子对象
        this.pieces = this.initialPieces.map(piece => ({
            ...piece,
            radius: 31, // 增大棋子半径
            selected: false,
            svgImage: null // 将用于存储 SVG 图像
        }));

        // 创建所有棋子的 SVG 图像
        this.createPieceSVGImages();
    }

    // 创建棋子的 SVG 图像（优化内存管理）
    createPieceSVGImages() {
        this.pieces.forEach(piece => {
            // 清理旧的SVG图像和URL
            if (piece.svgImage) {
                piece.svgImage = null;
            }
            if (piece.blobUrl) {
                URL.revokeObjectURL(piece.blobUrl);
                this.blobUrls.delete(piece.blobUrl);
                piece.blobUrl = null;
            }

            const svgString = this.createPieceSVG(piece.type, piece.color);
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            // 跟踪URL以便后续清理
            this.blobUrls.add(url);
            piece.blobUrl = url;

            const img = new Image();
            img.onload = () => {
                piece.svgImage = img;
                this.render(); // 渲染一次
                // 立即清理URL以释放内存
                URL.revokeObjectURL(url);
                this.blobUrls.delete(url);
                piece.blobUrl = null;
            };
            img.onerror = () => {
                console.error('Failed to load SVG image for piece:', piece.type, piece.color);
                // 清理失败的URL
                URL.revokeObjectURL(url);
                this.blobUrls.delete(url);
                piece.blobUrl = null;
            };
            img.src = url;
        });
    }

    // 创建棋子 SVG 字符串
    createPieceSVG(pieceType, pieceColor) {
        const color = pieceColor === 'red' ? '#dc3545' : '#495057';
        return `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <!-- 白色背景 -->
          <circle cx="60" cy="60" r="55" fill="white"/>

          <!-- 棋子主体 - 外圈 -->
          <circle cx="60" cy="60" r="55" fill="none" stroke="${color}" stroke-width="2"/>

          <!-- 内圈 -->
          <circle cx="60" cy="60" r="48" fill="none" stroke="${color}" stroke-width="1"/>

          <!-- 棋子文字 -->
          <text x="60" y="90" text-anchor="middle" font-family="KaiTi, STKaiti, serif" font-size="86" fill="${color}" font-weight="bold">${pieceType}</text>
        </svg>`;
    }

    // 统一渲染方法（优化版本 - 防止重复渲染）
    render() {
        if (this.renderScheduled) return;

        this.renderScheduled = true;
        requestAnimationFrame(() => {
            this.drawBoard();
            this.drawPieces();
            this.drawValidMoves();
            this.renderScheduled = false;
        });
    }

    // 绘制棋子
    drawPieces() {
        const ctx = this.ctx;

        this.pieces.forEach(piece => {
            const boardStartX = (this.boardWidth - this.gridWidth) / 2;
            const boardStartY = (this.boardHeight - this.gridHeight) / 2;
            const x = boardStartX + piece.x * this.cellSize;
            const y = boardStartY + piece.y * this.cellSize;

            ctx.save();

            // 如果 SVG 图像已加载，绘制 SVG
            if (piece.svgImage) {
                // 绘制选中效果
                if (piece.selected) {
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(x, y, piece.radius + 3, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // 绘制将军效果
                if (this.isCheck && (piece.type === '將' || piece.type === '帥')) {
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(x, y, piece.radius + 8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // 绘制 SVG 图像（缩放到合适大小）
                const imageSize = piece.radius * 2 * 1.1; // 稍微放大一点
                ctx.drawImage(
                    piece.svgImage,
                    x - imageSize / 2,
                    y - imageSize / 2,
                    imageSize,
                    imageSize
                );
            } else {
                // 如果 SVG 还没加载完成，绘制占位符
                ctx.fillStyle = '#f0f0f0';
                ctx.beginPath();
                ctx.arc(x, y, piece.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#999';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('加载中...', x, y);
            }

            ctx.restore();
        });
    }

    // 绘制可移动位置
    drawValidMoves() {
        const ctx = this.ctx;
        const boardStartX = (this.boardWidth - this.gridWidth) / 2;
        const boardStartY = (this.boardHeight - this.gridHeight) / 2;

        this.validMoves.forEach(move => {
            const x = boardStartX + move.x * this.cellSize;
            const y = boardStartY + move.y * this.cellSize;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 28, 0, Math.PI * 2); // 与棋子半径一致
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
    }

    // 获取指定位置的棋子
    getPieceAt(x, y) {
        return this.pieces.find(piece => piece.x === x && piece.y === y);
    }

    // 判断移动是否合法
    isValidMove(piece, fromX, fromY, toX, toY) {
        const pieceType = piece.type;
        const pieceColor = piece.color;

        // 检查目标位置是否在棋盘范围内
        if (toX < 0 || toX > 8 || toY < 0 || toY > 9) {
            return false;
        }

        // 检查目标位置是否有己方棋子
        const targetPiece = this.getPieceAt(toX, toY);
        if (targetPiece && targetPiece.color === pieceColor) {
            return false;
        }

        // 根据棋子类型判断移动规则
        let basicMoveValid = false;
        switch (pieceType) {
            case '將':
            case '帥':
                basicMoveValid = this.isValidGeneralMove(fromX, fromY, toX, toY, pieceColor);
                break;
            case '士':
            case '仕':
                basicMoveValid = this.isValidAdvisorMove(fromX, fromY, toX, toY, pieceColor);
                break;
            case '象':
            case '相':
                basicMoveValid = this.isValidElephantMove(fromX, fromY, toX, toY, pieceColor);
                break;
            case '馬':
                basicMoveValid = this.isValidHorseMove(fromX, fromY, toX, toY);
                break;
            case '車':
                basicMoveValid = this.isValidChariotMove(fromX, fromY, toX, toY);
                break;
            case '砲':
            case '炮':
                basicMoveValid = this.isValidCannonMove(fromX, fromY, toX, toY);
                break;
            case '卒':
            case '兵':
                basicMoveValid = this.isValidSoldierMove(fromX, fromY, toX, toY, pieceColor);
                break;
            default:
                return false;
        }

        // 如果基本移动规则不合法，直接返回false
        if (!basicMoveValid) {
            return false;
        }

        // 模拟移动，检查是否会导致将帅照面
        const originalTarget = this.getPieceAt(toX, toY);

        // 临时移动棋子
        const originalX = piece.x;
        const originalY = piece.y;
        piece.x = toX;
        piece.y = toY;

        // 如果目标位置有棋子，暂时移除
        let removedPiece = null;
        if (originalTarget) {
            const index = this.pieces.indexOf(originalTarget);
            if (index > -1) {
                removedPiece = this.pieces.splice(index, 1)[0];
            }
        }

        // 检查是否会导致将帅照面
        const wouldCauseFacing = this.checkGeneralsFacing();

        // 恢复原状
        piece.x = originalX;
        piece.y = originalY;
        if (removedPiece) {
            this.pieces.push(removedPiece);
        }

        // 如果会导致将帅照面，则为非法移动
        if (wouldCauseFacing) {
            return false;
        }

        return true;
    }

    // 将/帥移动规则
    isValidGeneralMove(fromX, fromY, toX, toY, color) {
        // 只能在九宫格内移动
        if (color === 'red') {
            if (toX < 3 || toX > 5 || toY < 7 || toY > 9) {
                return false;
            }
        } else {
            if (toX < 3 || toX > 5 || toY < 0 || toY > 2) {
                return false;
            }
        }

        // 只能移动一格
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        if (deltaX + deltaY !== 1) {
            return false;
        }

        // 检查将帅是否面对面
        const enemyColor = color === 'red' ? 'black' : 'red';
        const enemyGeneral = this.findGeneral(enemyColor);
        if (enemyGeneral && enemyGeneral.x === toX) {
            let blocked = false;
            const enemyY = enemyGeneral.y;
            const minY = Math.min(toY, enemyY);
            const maxY = Math.max(toY, enemyY);
            for (let y = minY + 1; y < maxY; y++) {
                if (this.getPieceAt(toX, y)) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return false; // 将帅面对面，这是非法的
            }
        }

        return true;
    }

    // 士/仕移动规则
    isValidAdvisorMove(fromX, fromY, toX, toY, color) {
        // 只能在九宫格内移动
        if (color === 'red') {
            if (toX < 3 || toX > 5 || toY < 7 || toY > 9) {
                return false;
            }
        } else {
            if (toX < 3 || toX > 5 || toY < 0 || toY > 2) {
                return false;
            }
        }

        // 只能斜向移动一格
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        return deltaX === 1 && deltaY === 1;
    }

    // 象/相移动规则
    isValidElephantMove(fromX, fromY, toX, toY, color) {
        // 不能过河
        if (color === 'red' && toY < 5) {
            return false;
        }
        if (color === 'black' && toY > 4) {
            return false;
        }

        // 必须移动"田"字
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);
        if (deltaX !== 2 || deltaY !== 2) {
            return false;
        }

        // 检查是否被阻挡（象眼）
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        return !this.getPieceAt(midX, midY);
    }

    // 馬移动规则
    isValidHorseMove(fromX, fromY, toX, toY) {
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);

        // 必须移动"日"字
        if (!((deltaX === 1 && deltaY === 2) || (deltaX === 2 && deltaY === 1))) {
            return false;
        }

        // 检查是否被阻挡（马腿）
        if (deltaX === 2) {
            const blockX = fromX + (toX > fromX ? 1 : -1);
            return !this.getPieceAt(blockX, fromY);
        } else {
            const blockY = fromY + (toY > fromY ? 1 : -1);
            return !this.getPieceAt(fromX, blockY);
        }
    }

    // 車移动规则
    isValidChariotMove(fromX, fromY, toX, toY) {
        // 必须直线移动
        if (fromX !== toX && fromY !== toY) {
            return false;
        }

        // 检查路径上是否有棋子阻挡
        if (fromX === toX) {
            const minY = Math.min(fromY, toY);
            const maxY = Math.max(fromY, toY);
            for (let y = minY + 1; y < maxY; y++) {
                if (this.getPieceAt(fromX, y)) {
                    return false;
                }
            }
        } else {
            const minX = Math.min(fromX, toX);
            const maxX = Math.max(fromX, toX);
            for (let x = minX + 1; x < maxX; x++) {
                if (this.getPieceAt(x, fromY)) {
                    return false;
                }
            }
        }

        return true;
    }

    // 砲/炮移动规则
    isValidCannonMove(fromX, fromY, toX, toY) {
        // 必须直线移动
        if (fromX !== toX && fromY !== toY) {
            return false;
        }

        let pieceCount = 0;

        // 计算路径上的棋子数量
        if (fromX === toX) {
            const minY = Math.min(fromY, toY);
            const maxY = Math.max(fromY, toY);
            for (let y = minY + 1; y < maxY; y++) {
                if (this.getPieceAt(fromX, y)) {
                    pieceCount++;
                }
            }
        } else {
            const minX = Math.min(fromX, toX);
            const maxX = Math.max(fromX, toX);
            for (let x = minX + 1; x < maxX; x++) {
                if (this.getPieceAt(x, fromY)) {
                    pieceCount++;
                }
            }
        }

        const targetPiece = this.getPieceAt(toX, toY);

        // 如果目标位置有棋子，必须跳过一个棋子吃子
        if (targetPiece) {
            return pieceCount === 1;
        }
        // 如果目标位置没有棋子，路径必须没有棋子
        else {
            return pieceCount === 0;
        }
    }

    // 卒/兵移动规则
    isValidSoldierMove(fromX, fromY, toX, toY, color) {
        const deltaX = Math.abs(toX - fromX);
        const deltaY = Math.abs(toY - fromY);

        // 只能移动一格
        if (deltaX + deltaY !== 1) {
            return false;
        }

        if (color === 'red') {
            // 红兵只能向前或横向（过河后）
            if (fromY <= 4) {
                // 过河了，可以向前或横向
                return (toY === fromY - 1) || (toY === fromY && deltaX === 1);
            } else {
                // 未过河，只能向前
                return toY === fromY - 1 && deltaX === 0;
            }
        } else {
            // 黑卒只能向前或横向（过河后）
            if (fromY >= 5) {
                // 过河了，可以向前或横向
                return (toY === fromY + 1) || (toY === fromY && deltaX === 1);
            } else {
                // 未过河，只能向前
                return toY === fromY + 1 && deltaX === 0;
            }
        }
    }

    // 查找将/帥
    findGeneral(color) {
        return this.pieces.find(piece =>
            piece.color === color &&
            (piece.type === '將' || piece.type === '帥')
        );
    }

      // 处理棋盘点击（增强边界检查）
    handleBoardClick(event) {
        // 只有玩家回合才能操作，且不能是电脑思考时
        if (!this.gameStarted || !this.isPlayerTurn || this.computerThinking) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // 验证点击坐标有效性
        if (!clickX || !clickY || isNaN(clickX) || isNaN(clickY)) {
            return;
        }

        const boardStartX = (this.boardWidth - this.gridWidth) / 2;
        const boardStartY = (this.boardHeight - this.gridHeight) / 2;

        // 验证棋盘边界（扩展范围以包含边缘棋子的露在外面部分）
        const boardTolerance = 40; // 为边缘棋子提供的额外点击区域
        if (clickX < boardStartX - boardTolerance ||
            clickX > boardStartX + this.gridWidth + boardTolerance ||
            clickY < boardStartY - boardTolerance ||
            clickY > boardStartY + this.gridHeight + boardTolerance) {
            return;
        }

        // 检查是否点击了棋子
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const piece = this.pieces[i];
            if (!piece) continue; // 安全检查

            const x = boardStartX + piece.x * this.cellSize;
            const y = boardStartY + piece.y * this.cellSize;

            // 计算点击位置到棋子中心的距离
            const deltaX = clickX - x;
            const deltaY = clickY - y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // 使用动态半径，提供容错范围
            const effectiveRadius = (piece && piece.radius) ? piece.radius : 31;
            const clickTolerance = effectiveRadius + 5; // 增加点击容错

            // 如果点击在棋子范围内
            if (distance <= clickTolerance) {
                // 玩家只能操作红方棋子
                if (piece.color === 'red') {
                    this.selectPiece(piece);
                } else if (this.selectedPiece && this.selectedPiece.color === 'red') {
                    const fromX = this.selectedPiece.x;
                    const fromY = this.selectedPiece.y;
                    const toX = piece.x;
                    const toY = piece.y;

                    if (this.isValidMove(this.selectedPiece, fromX, fromY, toX, toY)) {
                        this.movePiece(fromX, fromY, toX, toY);
                    } else {
                        this.showMessage(this.getUserFriendlyMessage('非法移动'));
                        this.clearSelection();
                    }
                }
                return;
            }
        }

        // 如果没有点击棋子，检查是否点击了可移动位置
        if (this.selectedPiece && this.selectedPiece.color === 'red') {
            for (const move of this.validMoves) {
                if (!move || typeof move.x !== 'number' || typeof move.y !== 'number') {
                    continue; // 跳过无效的移动数据
                }

                const x = boardStartX + move.x * this.cellSize;
                const y = boardStartY + move.y * this.cellSize;

                const deltaX = clickX - x;
                const deltaY = clickY - y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                // 使用与棋子相同的点击容错范围
                const effectiveRadius = (this.selectedPiece && this.selectedPiece.radius) ? this.selectedPiece.radius : 31;
                const clickTolerance = effectiveRadius + 5;

                if (distance <= clickTolerance) {
                    const fromX = this.selectedPiece.x;
                    const fromY = this.selectedPiece.y;
                    const toX = move.x;
                    const toY = move.y;

                    // 再次验证移动有效性
                    if (this.isValidMove(this.selectedPiece, fromX, fromY, toX, toY)) {
                        this.movePiece(fromX, fromY, toX, toY);
                    } else {
                        this.showMessage('这个移动不符合规则！');
                        this.clearSelection();
                    }
                    return;
                }
            }
        }
    }

    // 选择棋子
    selectPiece(piece) {
        this.clearSelection();
        this.selectedPiece = piece;
        piece.selected = true;
        this.calculateValidMoves(piece);
        this.render();
    }

    // 清除选择
    clearSelection() {
        if (this.selectedPiece) {
            this.selectedPiece.selected = false;
            this.selectedPiece = null;
        }
        this.validMoves = [];
    }

    // 计算可移动位置（带缓存优化）
    calculateValidMoves(piece) {
        // 创建缓存键
        const cacheKey = `${piece.x},${piece.y},${piece.type},${piece.color}`;

        // 检查缓存
        if (this.validMovesCache.has(cacheKey)) {
            this.validMoves = [...this.validMovesCache.get(cacheKey)];
            return;
        }

        // 计算有效移动
        this.validMoves = [];
        for (let x = 0; x <= 8; x++) {
            for (let y = 0; y <= 9; y++) {
                if (this.isValidMove(piece, piece.x, piece.y, x, y)) {
                    this.validMoves.push({ x, y });
                }
            }
        }

        // 缓存结果（限制缓存大小）
        if (this.validMovesCache.size > 100) {
            // 清理最旧的缓存项
            const firstKey = this.validMovesCache.keys().next().value;
            this.validMovesCache.delete(firstKey);
        }
        this.validMovesCache.set(cacheKey, [...this.validMoves]);
    }

    // 清理有效移动缓存（在棋子移动后调用）
    clearValidMovesCache() {
        this.validMovesCache.clear();
    }

    // 移动棋子
    movePiece(fromX, fromY, toX, toY) {
        const targetPiece = this.getPieceAt(toX, toY);

        // 记录移动历史（用于悔棋）
        const moveRecord = {
            from: { x: fromX, y: fromY },
            to: { x: toX, y: toY },
            piece: {
                type: this.selectedPiece.type,
                color: this.selectedPiece.color
            },
            captured: null
        };

        // 检查是否吃掉了对方的将/帅
        let generalCaptured = false;
        if (targetPiece) {
            moveRecord.captured = {
                type: targetPiece.type,
                color: targetPiece.color
            };

            // 检查是否吃掉了将/帅
            if ((targetPiece.type === '將' || targetPiece.type === '帥') && targetPiece.color !== this.currentPlayer) {
                generalCaptured = true;
            }

            // 从棋子数组中移除被吃的棋子
            const index = this.pieces.indexOf(targetPiece);
            if (index > -1) {
                this.pieces.splice(index, 1);
            }
        }

        // 移动棋子
        this.selectedPiece.x = toX;
        this.selectedPiece.y = toY;

        // 只记录实际的移动步骤，不添加描述
        this.moveHistory.push(moveRecord);

        // 更新移动记录显示
        this.updateMoveHistoryDisplay();

        // 如果吃掉了将/帅，直接结束游戏
        if (generalCaptured) {
            this.showMessage(`${this.currentPlayer === 'red' ? '红方' : '黑方'}获胜！（吃掉对方${moveRecord.captured.type}）`);
            this.gameStarted = false;
            this.clearSelection();
            this.render();
            return;
        }

        // 检查双方将军状态
        this.checkBothSidesCheck();

        // 检查将死
        this.isCheckmate = this.checkForCheckmate();
        if (this.isCheckmate) {
            this.showMessage(`${this.currentPlayer === 'red' ? '红方' : '黑方'}获胜！（将死）`);
            this.gameStarted = false;
        } else {
            // 切换玩家
            this.switchPlayer();
        }

        this.clearSelection();
        this.render();
    }

    // 检查双方将军状态
    checkBothSidesCheck() {
        const redGeneral = this.findGeneral('red');
        const blackGeneral = this.findGeneral('black');

        if (!redGeneral || !blackGeneral) {
            return;
        }

        // 检查红方是否被将军
        const redInCheck = this.isKingInCheck('red');
        // 检查黑方是否被将军
        const blackInCheck = this.isKingInCheck('black');

        // 设置将军状态
        this.isCheck = this.currentPlayer === 'red' ? redInCheck : blackInCheck;

        // 显示将军提示
        if (redInCheck && blackInCheck) {
            this.showMessage('双方将军！');
        } else if (redInCheck) {
            this.showMessage('红方被将军！');
        } else if (blackInCheck) {
            this.showMessage('黑方被将军！');
        }
    }

    // 电脑AI走棋 - 使用Web Worker
    computerMove() {
        if (this.computerThinking || !this.gameStarted || this.isCheckmate) {
            return;
        }

        this.computerThinking = true;
        this.showAIThinkingMessage();

        // 更新按钮状态（禁用悔棋）
        this.updateButtonStates();

        if (this.aiWorker) {
            // 使用Web Worker进行计算
            this.currentJobId++;
            const jobId = this.currentJobId;
            const searchDepth = this.getSearchDepthByDifficulty();

            this.pendingJob = {
                jobId: jobId,
                startTime: Date.now()
            };

            // 清理棋子数据，移除不能克隆的对象
            const cleanPieces = this.pieces.map(piece => ({
                type: piece.type,
                color: piece.color,
                x: piece.x,
                y: piece.y,
                radius: piece.radius
                // 移除 svgImage, selected 等不能克隆的属性
            }));

            // 发送计算任务到Worker
            this.aiWorker.postMessage({
                type: 'calculate',
                data: {
                    pieces: cleanPieces,
                    color: 'black',
                    depth: searchDepth,
                    moveHistory: this.moveHistory,
                    gameDifficulty: this.gameDifficulty,
                    jobId: jobId
                }
            });
        } else {
            // 回退到同步计算（如果Worker初始化失败）
            setTimeout(() => {
                try {
                    const searchDepth = this.getSearchDepthByDifficulty();
                    const bestMove = this.findBestMove('black', searchDepth);
                    if (bestMove) {
                        this.executeComputerMove(bestMove);
                    } else {
                        this.hideAIThinkingMessage();
                        this.computerThinking = false;
                        this.updateButtonStates();
                        this.showMessage('AI无法找到合适的走法');
                    }
                } catch (error) {
                    console.error('同步AI计算错误:', error);
                    this.hideAIThinkingMessage();
                    this.computerThinking = false;
                    this.updateButtonStates();
                    this.showMessage('AI计算出现错误，使用简化模式');
                }
            }, 2000);
        }
    }

    // 根据难度级别获取搜索深度
    getSearchDepthByDifficulty() {
        // 普通难度: 3层, 中等难度: 4层, 困难难度: 5层
        const difficultyLevels = {
            'medium': 3,
            'hard': 4,
            'expert': 5
        };

        // 默认使用普通难度
        return difficultyLevels[this.gameDifficulty] || difficultyLevels['medium'];
    }

    // 设置游戏难度
    setDifficulty(difficulty) {
        const validDifficulties = ['medium', 'hard', 'expert'];
        if (validDifficulties.includes(difficulty)) {
            this.gameDifficulty = difficulty;
            this.updateDifficultyDisplay(difficulty);
            this.showMessage(`难度已设置为: ${this.getDifficultyName(difficulty)}`);
        }
    }

    // 获取难度名称
    getDifficultyName(difficulty) {
        const difficultyNames = {
            'medium': '普通',
            'hard': '中等',
            'expert': '困难'
        };
        return difficultyNames[difficulty] || '普通';
    }

    // 更新难度显示
    updateDifficultyDisplay(difficulty) {
        // 更新显示文本
        const difficultyElement = document.getElementById('difficulty-level');
        if (difficultyElement) {
            difficultyElement.textContent = this.getDifficultyName(difficulty);
        }

        // 更新按钮状态
        const buttons = [
            { id: 'difficulty-medium', difficulty: 'medium' },
            { id: 'difficulty-hard', difficulty: 'hard' },
            { id: 'difficulty-expert', difficulty: 'expert' }
        ];

        buttons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element) {
                if (button.difficulty === difficulty) {
                    element.classList.add('primary');
                    element.classList.remove('secondary');
                } else {
                    element.classList.add('secondary');
                    element.classList.remove('primary');
                }
            }
        });
    }

    // 寻找最佳走法（增加随机性） - 回退版本
    findBestMove(color, depth) {
        const pieces = this.pieces.filter(piece => piece.color === color);
        const validMoves = [];

        // 收集所有合法走法及其评分
        for (const piece of pieces) {
            for (let toX = 0; toX <= 8; toX++) {
                for (let toY = 0; toY <= 9; toY++) {
                    if (this.isValidMove(piece, piece.x, piece.y, toX, toY)) {
                        // 模拟移动
                        const originalPiece = this.getPieceAt(toX, toY);
                        const fromX = piece.x;
                        const fromY = piece.y;

                        // 执行移动
                        piece.x = toX;
                        piece.y = toY;
                        if (originalPiece) {
                            const index = this.pieces.indexOf(originalPiece);
                            this.pieces.splice(index, 1);
                        }

                        // 评估局势
                        const score = this.minimax(depth - 1, color === 'black' ? 'red' : 'black', -Infinity, Infinity);

                        // 恢复移动
                        piece.x = fromX;
                        piece.y = fromY;
                        if (originalPiece) {
                            this.pieces.push(originalPiece);
                        }

                        validMoves.push({
                            score: score,
                            move: {
                                piece: piece,
                                fromX: fromX,
                                fromY: fromY,
                                toX: toX,
                                toY: toY
                            }
                        });
                    }
                }
            }
        }

        if (validMoves.length === 0) {
            return null;
        }

        // 开局阶段使用特殊策略
        if (this.moveHistory.length <= 5) {
            return this.selectOpeningMove(validMoves, color);
        }

        // 根据难度决定选择策略
        return this.selectMoveWithRandomness(validMoves, color);
    }

    // 开局阶段走法选择（增加多样性）
    selectOpeningMove(validMoves, color) {
        // 开局优先级：炮 > 马 > 兵/卒 > 車 > 其他
        const piecePriority = {
            '砲': 5, '炮': 5,
            '馬': 4,
            '卒': 3, '兵': 3,
            '車': 2,
            '象': 1, '相': 1,
            '士': 1, '仕': 1,
            '將': 0, '帥': 0
        };

        // 按优先级和随机性排序
        validMoves.sort((a, b) => {
            const priorityA = piecePriority[a.move.piece.type] || 0;
            const priorityB = piecePriority[b.move.piece.type] || 0;

            // 优先级高的在前，相同优先级则按分数
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }

            if (color === 'black') {
                return b.score - a.score;
            } else {
                return a.score - b.score;
            }
        });

        // 开局阶段随机性更强
        const moveCount = this.moveHistory.length;
        let randomRange;

        if (moveCount <= 1) {
            randomRange = Math.min(8, validMoves.length); // 第一步从前8个中随机选
        } else if (moveCount <= 3) {
            randomRange = Math.min(5, validMoves.length); // 前三步从前5个中随机选
        } else {
            randomRange = Math.min(3, validMoves.length); // 开局阶段从前3个中随机选
        }

        const selectedIndex = Math.floor(Math.random() * randomRange);
        return validMoves[selectedIndex].move;
    }

    // 根据随机性选择走法
    selectMoveWithRandomness(validMoves, color, depth) {
        // 按分数排序
        validMoves.sort((a, b) => {
            if (color === 'black') {
                return b.score - a.score; // 黑方选择高分
            } else {
                return a.score - b.score; // 红方选择低分
            }
        });

        // 根据难度和游戏阶段决定随机性
        const randomFactor = this.getRandomnessFactor();

        // 开局阶段增加随机性
        const isEarlyGame = this.moveHistory.length < 10;
        const earlyGameBonus = isEarlyGame ? 0.3 : 0;

        // 计算有效走法范围
        const maxIndex = Math.min(
            Math.floor(validMoves.length * (randomFactor + earlyGameBonus)),
            validMoves.length - 1
        );

        // 如果只有1个走法或者随机性很低，选择最佳走法
        if (maxIndex === 0 || Math.random() > randomFactor) {
            return validMoves[0].move;
        }

        // 从前几个最佳走法中随机选择
        const selectedIndex = Math.floor(Math.random() * (maxIndex + 1));
        return validMoves[selectedIndex].move;
    }

    // 获取随机性因子
    getRandomnessFactor() {
        // 根据难度设置不同的随机性
        const randomnessMap = {
            'easy': 0.8,    // 简单难度：80%随机性
            'medium': 0.4,  // 中等难度：40%随机性
            'hard': 0.15,   // 困难难度：15%随机性
            'expert': 0.05  // 专家难度：5%随机性
        };

        let baseRandomness = randomnessMap[this.gameDifficulty] || randomnessMap['medium'];

        // 开局阶段大幅增加随机性（前5步）
        const moveCount = this.moveHistory.length;
        if (moveCount <= 2) {
            baseRandomness = Math.min(1.0, baseRandomness + 0.4); // 前两步增加40%随机性
        } else if (moveCount <= 5) {
            baseRandomness = Math.min(1.0, baseRandomness + 0.2); // 前5步增加20%随机性
        }

        return baseRandomness;
    }

    // Minimax算法
    minimax(depth, currentPlayer, alpha, beta) {
        if (depth === 0) {
            return this.evaluatePosition();
        }

        const pieces = this.pieces.filter(piece => piece.color === currentPlayer);

        if (currentPlayer === 'black') {
            let maxScore = -Infinity;
            for (const piece of pieces) {
                for (let toX = 0; toX <= 8; toX++) {
                    for (let toY = 0; toY <= 9; toY++) {
                        if (this.isValidMove(piece, piece.x, piece.y, toX, toY)) {
                            // 模拟移动
                            const originalPiece = this.getPieceAt(toX, toY);
                            const fromX = piece.x;
                            const fromY = piece.y;

                            piece.x = toX;
                            piece.y = toY;
                            if (originalPiece) {
                                const index = this.pieces.indexOf(originalPiece);
                                this.pieces.splice(index, 1);
                            }

                            const score = this.minimax(depth - 1, 'red', alpha, beta);

                            // 恢复移动
                            piece.x = fromX;
                            piece.y = fromY;
                            if (originalPiece) {
                                this.pieces.push(originalPiece);
                            }

                            maxScore = Math.max(maxScore, score);
                            alpha = Math.max(alpha, score);
                            if (beta <= alpha) {
                                return maxScore; // Alpha-beta剪枝
                            }
                        }
                    }
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const piece of pieces) {
                for (let toX = 0; toX <= 8; toX++) {
                    for (let toY = 0; toY <= 9; toY++) {
                        if (this.isValidMove(piece, piece.x, piece.y, toX, toY)) {
                            // 模拟移动
                            const originalPiece = this.getPieceAt(toX, toY);
                            const fromX = piece.x;
                            const fromY = piece.y;

                            piece.x = toX;
                            piece.y = toY;
                            if (originalPiece) {
                                const index = this.pieces.indexOf(originalPiece);
                                this.pieces.splice(index, 1);
                            }

                            const score = this.minimax(depth - 1, 'black', alpha, beta);

                            // 恢复移动
                            piece.x = fromX;
                            piece.y = fromY;
                            if (originalPiece) {
                                this.pieces.push(originalPiece);
                            }

                            minScore = Math.min(minScore, score);
                            beta = Math.min(beta, score);
                            if (beta <= alpha) {
                                return minScore; // Alpha-beta剪枝
                            }
                        }
                    }
                }
            }
            return minScore;
        }
    }

    // 评估局势
    evaluatePosition() {
        let score = 0;

        // 棋子价值表
        const pieceValues = {
            '將': 10000, '帥': 10000,
            '車': 90, '馬': 40, '炮': 45, '象': 20, '士': 20, '相': 20, '仕': 20,
            '卒': 10, '兵': 10
        };

        // 位置价值表
        const positionValues = {
            '車': [
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [90, 90, 90, 90, 90, 90, 90, 90, 90],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ],
            '馬': [
                [0,  0, 20,  0,  0,  0, 20,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [18, 0,  0,  0,  0,  0,  0,  0, 18],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [18, 0,  0,  0,  0,  0,  0,  0, 18],
                [0,  0, 20,  0,  0,  0, 20,  0,  0]
            ],
            '炮': [
                [100, 100,  96,  91,  90,  91,  96, 100, 100],
                [ 98,  98,  96,  92,  89,  92,  96,  98,  98],
                [ 97,  97,  96,  91,  92,  91,  96,  97,  97],
                [ 96,  99,  99,  98, 100,  98,  99,  99,  96],
                [ 96,  96,  96,  96, 100,  96,  96,  96,  96],
                [ 95,  96,  99,  96, 100,  96,  99,  96,  95],
                [ 96,  96,  96,  96,  96,  96,  96,  96,  96],
                [ 97,  96, 100,  99, 101,  99, 100,  96,  97],
                [ 96,  97,  98,  98,  98,  98,  98,  97,  96],
                [ 96,  96,  97,  99,  99,  99,  97,  96,  96]
            ],
            '卒': [
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [ 9,  9,  9,  9,  9,  9,  9,  9,  9],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [14, 14, 14, 14, 14, 14, 14, 14, 14],
                [21, 21, 21, 21, 21, 21, 21, 21, 21],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [28, 28, 28, 28, 28, 28, 28, 28, 28],
                [42, 42, 42, 42, 42, 42, 42, 42, 42],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
                [ 0,  0,  0,  0,  0,  0,  0,  0,  0]
            ]
        };

        for (const piece of this.pieces) {
            const baseValue = pieceValues[piece.type] || 0;
            let positionValue = 0;

            // 获取位置价值
            const posKey = piece.type === '車' ? '車' :
                         piece.type === '馬' ? '馬' :
                         piece.type === '炮' || piece.type === '砲' ? '炮' :
                         piece.type === '卒' || piece.type === '兵' ? '卒' : null;

            if (posKey && positionValues[posKey]) {
                if (piece.color === 'black') {
                    positionValue = positionValues[posKey][piece.y][piece.x];
                } else {
                    // 红方位置需要镜像
                    positionValue = positionValues[posKey][9 - piece.y][piece.x];
                }
            }

            const totalValue = baseValue + positionValue;

            if (piece.color === 'black') {
                score += totalValue;
            } else {
                score -= totalValue;
            }
        }

        // 检查将军状态
        if (this.checkGeneralsFacing()) {
            return piece.color === 'black' ? -10000 : 10000;
        }

        return score;
    }

    // 执行电脑走棋
    executeComputerMove(move) {
        // AI开始走棋时隐藏思考消息
        this.hideAIThinkingMessage();

        // 找到要移动的棋子
        const piece = this.pieces[move.pieceIndex];
        if (!piece) {
            this.hideAIThinkingMessage();
            this.computerThinking = false;
            this.showMessage('AI走棋数据错误');
            return;
        }

        // 选择电脑棋子（用于显示效果）
        this.selectedPiece = piece;
        this.selectedPiece.selected = true;
        this.calculateValidMoves(piece);
        this.render();

        // 短暂延迟后执行移动
        setTimeout(() => {
            // 执行移动
            this.movePiece(move.fromX, move.fromY, move.toX, move.toY);
            this.computerThinking = false;
        }, 500);
    }

    // 获取移动文本描述
    getMoveText(moveRecord) {
        const pieceType = moveRecord.piece.type;
        const from = moveRecord.from;
        const to = moveRecord.to;
        const player = moveRecord.piece.color === 'red' ? '红方' : '黑方';

        let moveText = `${player} ${pieceType} (${from.x},${from.y}) → (${to.x},${to.y})`;
        if (moveRecord.captured) {
            moveText += ` 吃 ${moveRecord.captured.type}`;
        }

        return moveText;
    }

    // 切换玩家
    switchPlayer() {
        const previousPlayer = this.currentPlayer;
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';

        if (this.currentPlayer === 'red') {
            // 玩家回合
            this.isPlayerTurn = true;
            this.updatePlayerStatus('red-player', '游戏进行中');
            this.updatePlayerStatus('black-player', '等待中');
        } else {
            // 电脑回合
            this.isPlayerTurn = false;
            this.updatePlayerStatus('red-player', '等待中');
            this.updatePlayerStatus('black-player', '游戏进行中');
        }

        if (this.isCheck) {
            this.showMessage(`${previousPlayer === 'red' ? '红方' : '黑方'}被将军！`);
        }

        // 如果是电脑回合，自动走棋
        if (this.currentPlayer === 'black' && this.gameStarted && !this.isCheckmate) {
            setTimeout(() => {
                this.computerMove();
            }, 1500);
        }

        // 更新按钮状态
        this.updateButtonStates();
    }

    // 检查将帅照面
    checkGeneralsFacing() {
        const redGeneral = this.findGeneral('red');
        const blackGeneral = this.findGeneral('black');

        if (!redGeneral || !blackGeneral) {
            return false;
        }

        const redX = redGeneral.x;
        const redY = redGeneral.y;
        const blackX = blackGeneral.x;
        const blackY = blackGeneral.y;

        // 检查是否在同一列
        if (redX !== blackX) {
            return false;
        }

        // 检查中间是否有棋子阻挡
        let blocked = false;
        const minY = Math.min(redY, blackY);
        const maxY = Math.max(redY, blackY);
        for (let y = minY + 1; y < maxY; y++) {
            if (this.getPieceAt(redX, y)) {
                blocked = true;
                break;
            }
        }

        return !blocked; // 如果没有阻挡，则将帅照面
    }

    // 检查将军
    checkForCheck() {
        // 首先检查将帅照面（这会导致直接输棋）
        if (this.checkGeneralsFacing()) {
            this.isCheck = true;
            return;
        }

        // 检查当前玩家是否被对方攻击
        const enemyColor = this.currentPlayer === 'red' ? 'black' : 'red';
        const general = this.findGeneral(this.currentPlayer);

        if (!general) {
            return;
        }

        this.isCheck = false;

        // 检查对方的所有棋子是否能攻击到当前玩家的将/帅
        const enemyPieces = this.pieces.filter(piece => piece.color === enemyColor);
        for (const enemyPiece of enemyPieces) {
            if (this.isValidMove(enemyPiece, enemyPiece.x, enemyPiece.y, general.x, general.y)) {
                this.isCheck = true;
                break;
            }
        }
    }

    // 检查将死
    checkForCheckmate() {
        if (!this.isCheck) {
            return false;
        }

        // 获取所有己方棋子
        const myPieces = this.pieces.filter(piece => piece.color === this.currentPlayer);

        // 检查每个棋子的所有可能移动
        for (const piece of myPieces) {
            for (let toX = 0; toX <= 8; toX++) {
                for (let toY = 0; toY <= 9; toY++) {
                    if (this.isValidMove(piece, piece.x, piece.y, toX, toY)) {
                        // 模拟移动
                        const targetPiece = this.getPieceAt(toX, toY);
                        const originalX = piece.x;
                        const originalY = piece.y;

                        piece.x = toX;
                        piece.y = toY;

                        // 如果目标位置有棋子，暂时移除
                        let removedPiece = null;
                        if (targetPiece) {
                            const index = this.pieces.indexOf(targetPiece);
                            if (index > -1) {
                                removedPiece = this.pieces.splice(index, 1)[0];
                            }
                        }

                        // 检查是否还被将军
                        const stillInCheck = this.isKingInCheck(this.currentPlayer);

                        // 恢复原状
                        piece.x = originalX;
                        piece.y = originalY;
                        if (removedPiece) {
                            this.pieces.push(removedPiece);
                        }

                        if (!stillInCheck) {
                            return false; // 找到解除将军的移动
                        }
                    }
                }
            }
        }

        return true; // 将死
    }

    // 检查指定颜色的王是否被将军
    isKingInCheck(color) {
        const enemyColor = color === 'red' ? 'black' : 'red';
        const general = this.findGeneral(color);

        if (!general) {
            return false;
        }

        const enemyPieces = this.pieces.filter(piece => piece.color === enemyColor);
        for (const enemyPiece of enemyPieces) {
            if (this.isValidMove(enemyPiece, enemyPiece.x, enemyPiece.y, general.x, general.y)) {
                return true;
            }
        }

        return false;
    }

    // 悔棋（改进版：分两步撤回）
    undoMove() {
        // AI思考过程中禁止悔棋
        if (this.computerThinking) {
            this.showMessage('AI思考中，暂不能悔棋！');
            return;
        }

        if (this.isUndoing) {
            this.showMessage('正在悔棋中，请稍候...');
            return;
        }

        // 如果有选中的棋子，先清除选择状态
        if (this.selectedPiece) {
            this.clearSelection();
            this.render();
            this.showMessage('已取消棋子选择');
            return; // 不执行悔棋，只是取消选择
        }

        // 检查是否有足够的步骤可以悔棋（需要至少2步：AI+玩家）
        if (this.moveHistory.length < 2) {
            this.showMessage('需要AI和玩家各走一步后才能悔棋！');
            return;
        }

        this.isUndoing = true;
        this.showMessage('正在悔棋...');

        // 更新按钮状态
        this.updateButtonStates();

        // 分步执行悔棋，让用户能看到过程
        setTimeout(() => {
            this.undoSingleMove(); // 撤回最后一步（应该是AI的步）
        }, 500);
    }

    // 撤回单步棋
    undoSingleMove() {
        if (this.moveHistory.length === 0) {
            this.isUndoing = false;
            return;
        }

        const lastMove = this.moveHistory.pop();

        // 检查移动记录是否有效
        if (!lastMove || !lastMove.to || !lastMove.from) {
            console.error('Invalid move record:', lastMove);
            console.error('Move history length:', this.moveHistory.length);
            console.error('Remaining moves:', this.moveHistory);
            this.isUndoing = false;
            this.showMessage(this.getUserFriendlyMessage('Invalid move record'));
            return;
        }

        // 检查坐标是否有效
        if (typeof lastMove.to.x !== 'number' || typeof lastMove.to.y !== 'number' ||
            typeof lastMove.from.x !== 'number' || typeof lastMove.from.y !== 'number') {
            console.error('Invalid coordinates in move record:', lastMove);
            this.isUndoing = false;
            this.showMessage(this.getUserFriendlyMessage('Invalid coordinates in move record'));
            return;
        }

        // 找到移动的棋子
        const movedPiece = this.pieces.find(piece => piece.x === lastMove.to.x && piece.y === lastMove.to.y);
        if (movedPiece) {
            // 恢复棋子位置
            movedPiece.x = lastMove.from.x;
            movedPiece.y = lastMove.from.y;

            // 如果有吃子，恢复被吃的棋子
            if (lastMove.captured) {
                this.pieces.push({
                    ...lastMove.captured,
                    x: lastMove.to.x,
                    y: lastMove.to.y,
                    radius: 31, // 使用正确的半径
                    selected: false,
                    svgImage: null // 将重新创建SVG图像
                });
                // 为恢复的棋子创建SVG图像
                this.createPieceSVGImages();
            }

            // 更新移动记录显示
            this.updateMoveHistoryDisplay();

            // 重新渲染棋盘
            this.render();

            // 判断是否需要继续悔棋
            if (this.moveHistory.length > 0 &&
                ((this.currentPlayer === 'red' && this.moveHistory.length % 2 === 0) ||
                 (this.currentPlayer === 'black' && this.moveHistory.length % 2 === 1))) {
                // 继续撤回另一步
                setTimeout(() => {
                    this.undoSingleMove();
                }, 800);
            } else {
                // 悔棋完成
                setTimeout(() => {
                    this.completeUndo();
                }, 500);
            }
        } else {
            // 找不到棋子，可能是数据不一致，尝试恢复
            console.error('Cannot find piece to undo at position:', lastMove.to);
            console.error('Available pieces:', this.pieces.map(p => ({type: p.type, color: p.color, x: p.x, y: p.y})));

            // 尝试根据移动记录重新创建棋子
            if (lastMove.piece) {
                const recreatedPiece = {
                    ...lastMove.piece,
                    x: lastMove.from.x,
                    y: lastMove.from.y,
                    radius: 31,
                    selected: false,
                    svgImage: null
                };
                this.pieces.push(recreatedPiece);

                // 为重新创建的棋子生成SVG图像
                setTimeout(() => {
                    this.createPieceSVGImages();
                    this.render();
                }, 100);
            }

            this.isUndoing = false;
            this.showMessage(this.getUserFriendlyMessage('Cannot find piece to undo'));
        }
    }

    // 完成悔棋
    completeUndo() {
        // 重新检查将军状态
        this.checkBothSidesCheck();

        // 确保当前玩家是玩家（红方）
        if (this.currentPlayer === 'black') {
            this.switchPlayer();
        }

        // 更新玩家状态
        this.updatePlayerStatus('red-player', '游戏进行中');
        this.updatePlayerStatus('black-player', '等待中');

        this.isUndoing = false;

        // 更新按钮状态
        this.updateButtonStates();

        this.showMessage('悔棋成功！');
    }

    // 显示AI思考中的消息（持久化显示）
    showAIThinkingMessage() {
        this.hideAIThinkingMessage(); // 先清除之前的消息

        this.aiThinkingMessage = document.createElement('div');
        this.aiThinkingMessage.id = 'ai-thinking-message';
        this.aiThinkingMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.1rem;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
            max-width: 80%;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        this.aiThinkingMessage.textContent = 'AI思考中...';
        document.body.appendChild(this.aiThinkingMessage);
    }

    // 隐藏AI思考中的消息
    hideAIThinkingMessage() {
        if (this.aiThinkingMessage && document.body.contains(this.aiThinkingMessage)) {
            document.body.removeChild(this.aiThinkingMessage);
            this.aiThinkingMessage = null;
        }
    }

    // 显示消息（安全版本，防止XSS）- 单例toast
    showMessage(message) {
        // 安全清理和验证消息内容
        const sanitizedMessage = this.sanitizeMessage(message);

        // 清除之前的定时器
        if (this.toastTimer) {
            clearTimeout(this.toastTimer);
        }

        // 如果已有toast实例，直接更新内容
        if (this.currentToast && document.body.contains(this.currentToast)) {
            this.currentToast.textContent = sanitizedMessage;

            // 重新设置消失定时器
            this.toastTimer = setTimeout(() => {
                this.hideToast();
            }, 2000);
        } else {
            // 创建新的toast实例
            this.currentToast = document.createElement('div');
            this.currentToast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-size: 1.1rem;
                z-index: 1000;
                animation: fadeIn 0.3s ease;
                max-width: 80%;
                text-align: center;
            `;

            // 使用textContent防止XSS攻击
            this.currentToast.textContent = sanitizedMessage;

            document.body.appendChild(this.currentToast);

            // 设置消失定时器
            this.toastTimer = setTimeout(() => {
                this.hideToast();
            }, 2000);
        }
    }

    // 隐藏toast
    hideToast() {
        if (this.currentToast && document.body.contains(this.currentToast)) {
            this.currentToast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (this.currentToast && document.body.contains(this.currentToast)) {
                    document.body.removeChild(this.currentToast);
                }
                this.currentToast = null;
            }, 300);
        }
        this.toastTimer = null;
    }

    // 消息内容安全清理
    sanitizeMessage(message) {
        if (typeof message !== 'string') {
            return String(message);
        }

        return message
            // 移除HTML标签
            .replace(/<[^>]*>/g, '')
            // 移除JavaScript协议
            .replace(/javascript:/gi, '')
            // 移除事件处理器
            .replace(/on\w+=/gi, '')
            // 移除潜在的脚本标签
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            // 限制长度
            .substring(0, 200)
            .trim();
    }

    // 用户友好的错误消息映射
    getUserFriendlyMessage(technicalMessage) {
        const messageMap = {
            'Invalid move record': '悔棋时遇到了问题，请重新开始游戏',
            'Invalid coordinates in move record': '悔棋数据有误，请重新开始游戏',
            'Cannot find piece to undo': '找不到要悔棋的棋子，请重新开始游戏',
            'AI走棋数据错误': '电脑思考出现了问题，请重新开始',
            '悔棋数据错误': '悔棋数据有误，请重新开始游戏',
            '悔棋坐标错误': '悔棋位置信息错误，请重新开始游戏',
            '非法移动': '这个移动不符合象棋规则',
            '这个移动不符合规则': '这个移动不符合象棋规则',
            'AI初始化失败': 'AI初始化失败，将使用简化模式',
            'AI计算出现错误': '电脑思考时出现了问题，请重新开始',
            'AI无法找到合适的走法': '电脑找不到合适的走法',
            'AI calculation error': 'AI计算时出现了错误',
            'No moves available': '没有可用的走法'
        };

        // 查找匹配的错误消息
        for (const [technical, friendly] of Object.entries(messageMap)) {
            if (technicalMessage.includes(technical)) {
                return friendly;
            }
        }

        // 默认返回通用消息
        return '操作失败，请重试';
    }

    // 初始化事件监听器
    initEventListeners() {
        this.startButton.addEventListener('click', () => {
            if (this.gameStarted) {
                this.restartGame();
            } else {
                this.startGame();
            }
        });

        this.undoButton.addEventListener('click', () => {
            this.undoMove();
        });

        // 添加难度设置按钮事件监听器
        if (this.difficultyMediumButton) {
            this.difficultyMediumButton.addEventListener('click', () => {
                this.setDifficulty('medium');
            });
        }

        if (this.difficultyHardButton) {
            this.difficultyHardButton.addEventListener('click', () => {
                this.setDifficulty('hard');
            });
        }

        if (this.difficultyExpertButton) {
            this.difficultyExpertButton.addEventListener('click', () => {
                this.setDifficulty('expert');
            });
        }

        // 添加棋盘点击事件
        this.canvas.addEventListener('click', (event) => {
            this.handleBoardClick(event);
        });
    }

    // 开始游戏
    startGame() {
        this.gameStarted = true;
        this.currentPlayer = 'black'; // 电脑先走
        this.isPlayerTurn = false; // AI先走
        this.selectedPiece = null;
        this.validMoves = [];
        this.isCheck = false;
        this.isCheckmate = false;
        this.computerThinking = false;

        // 更新玩家状态
        this.updatePlayerStatus('red-player', '等待中');
        this.updatePlayerStatus('black-player', '游戏进行中');

        // 添加游戏事件记录
        this.addGameEvent('游戏开始');

        this.showMessage('游戏开始！电脑先走');
        this.render();

        // 更新按钮状态
        this.updateButtonStates();

        // 让电脑先走
        setTimeout(() => {
            this.computerMove();
        }, 1500);
    }

    // 重新开始游戏
    restartGame() {
        // 中断并清理AI计算
        this.interruptAI();
        this.cleanupAIWorker();

        // 清理所有Blob URL资源
        this.cleanupBlobUrls();

        // 重置所有状态
        this.gameStarted = false;
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.gameEvents = []; // 清空游戏事件
        this.isCheck = false;
        this.isCheckmate = false;
        this.computerThinking = false;
        this.isUndoing = false;

        // 清理toast
        this.hideToast();

        // 重置AI任务
        this.currentJobId = 0;
        this.pendingJob = null;

        // 重新创建棋子
        this.createPieces();

        // 重新初始化AI Worker
        this.initAIWorker();

        // 重绘棋盘
        this.render();

        // 重置玩家状态
        this.updatePlayerStatus('red-player', '准备中');
        this.updatePlayerStatus('black-player', '准备中');

        // 清空移动记录
        this.moveList.innerHTML = '<div class="no-moves">暂无走棋记录</div>';

        // 更新按钮状态
        this.updateButtonStates();

        this.showMessage('游戏已重置');
    }

    // 更新玩家状态显示（使用缓存优化）
    updatePlayerStatus(playerClass, status) {
        // 修复cacheKey计算，保持一致性
        let cacheKey;
        if (playerClass === 'red-player') {
            cacheKey = 'redPlayerStatus';
        } else if (playerClass === 'black-player') {
            cacheKey = 'blackPlayerStatus';
        } else {
            cacheKey = playerClass.replace('-', '') + 'Status';
        }

        let playerElement = this.domCache[cacheKey];

        // 如果缓存中没有，尝试重新获取
        if (!playerElement) {
            const elementId = playerClass + '-status';
            playerElement = document.getElementById(elementId);
            if (playerElement) {
                this.domCache[cacheKey] = playerElement;
            }
        }

        if (playerElement) {
            playerElement.textContent = status;
        } else {
            console.warn(`Player status element not found: ${playerClass}-status`);
        }
    }

    // 添加游戏事件记录（不是移动记录）
    addGameEvent(event) {
        if (this.moveList.querySelector('.no-moves')) {
            this.moveList.innerHTML = '';
        }

        const moveItem = document.createElement('div');
        moveItem.className = 'move-item';
        moveItem.textContent = event;

        this.moveList.appendChild(moveItem);
        this.moveList.scrollTop = this.moveList.scrollHeight;
    }

    // 更新移动记录显示
    updateMoveHistoryDisplay() {
        this.moveList.innerHTML = '';

        // 显示所有游戏事件
        this.gameEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'move-item';
            eventItem.style.color = '#666';
            eventItem.textContent = event;
            this.moveList.appendChild(eventItem);
        });

        // 添加所有移动记录
        this.moveHistory.forEach((move, index) => {
            const moveText = this.getMoveText(move);
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            moveItem.innerHTML = `<span class="move-number">${index + 1}</span>. <span class="move-text">${moveText}</span>`;

            this.moveList.appendChild(moveItem);
        });

        // 如果没有任何记录，显示占位符
        if (this.gameEvents.length === 0 && this.moveHistory.length === 0) {
            this.moveList.innerHTML = '<div class="no-moves">暂无走棋记录</div>';
        } else {
            this.moveList.scrollTop = this.moveList.scrollHeight;
        }
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    }
`;
document.head.appendChild(style);

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new ChineseChess();
});