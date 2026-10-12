const { WebSocketServer } = require('ws');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

let activeSessions = {};
let systemGlobalLedger = { totalBlocksProcessed: 0, estimatedPlatformEarnings: 0.00000000 };

console.log(`[INIT] Automated Cloud Proxy active on port ${PORT}. Ready for deployment signals...`);

wss.on('connection', (ws) => {
    let sessionWallet = null;
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'INITIALIZE_DEPLOYMENT') {
                sessionWallet = data.walletAddress;
                activeSessions[sessionWallet] = { socket: ws, sharesContributed: 0, status: "Active Mining", activatedAt: Date.now() };
                console.log(`[DEPLOY] Auto-Engine started for wallet: ${sessionWallet}`);
                dispatchNextTask(ws, sessionWallet);
            }
            if (data.type === 'SUBMIT_COMPUTATION_PROOF') {
                if (!sessionWallet || !activeSessions[sessionWallet]) return;
                const isValid = verifyBlockProof(data.nonce, data.challenge, data.target);
                if (isValid) {
                    activeSessions[sessionWallet].sharesContributed++;
                    systemGlobalLedger.totalBlocksProcessed++;
                    systemGlobalLedger.estimatedPlatformEarnings += 0.00000025;
                    ws.send(JSON.stringify({
                        type: 'STATUS_UPDATE',
                        status: 'Mining Active',
                        shares: activeSessions[sessionWallet].sharesContributed,
                        totalEarnings: systemGlobalLedger.estimatedPlatformEarnings
                    }));
                }
                dispatchNextTask(ws, sessionWallet);
            }
        } catch (err) { console.error('[ERROR]', err.message); }
    });
    ws.on('close', () => { if (sessionWallet) delete activeSessions[sessionWallet]; });
});

function dispatchNextTask(ws, wallet) {
    ws.send(JSON.stringify({ type: 'RUN_WORKLOAD', challenge: crypto.randomBytes(16).toString('hex'), target: '0000' }));
}

function verifyBlockProof(nonce, challenge, target) {
    return crypto.createHash('sha256').update(challenge + nonce).digest('hex').startsWith(target);
}
