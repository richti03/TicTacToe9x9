let supabaseClient = null;
let remoteGame = null;
let remoteChannel = null;
let onlineMode = false;
let remoteUserId = null;

async function initializeMultiplayer() {
    const config = window.SUPABASE_CONFIG;
    const status = document.getElementById("onlineStatus");
    if (!config || !config.url || config.url.includes("YOUR_PROJECT")) {
        status.textContent = "Supabase ist noch nicht konfiguriert.";
        return;
    }
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    let {data: {session}} = await supabaseClient.auth.getSession();
    if (!session) {
        const result = await supabaseClient.auth.signInAnonymously();
        if (result.error) return setOnlineStatus(result.error.message, true);
        session = result.data.session;
    }
    remoteUserId = session.user.id;
    setOnlineStatus("Bereit für ein Online-Spiel.");
    document.querySelectorAll("#createOnlineButton, #joinOnlineButton").forEach(button => button.disabled = false);
}

function setOnlineStatus(message, error = false) {
    const element = document.getElementById("onlineStatus");
    element.textContent = message;
    element.classList.toggle("error", error);
}

async function createOnlineGame() {
    if (!supabaseClient) return;
    const variant = miniTicTacToe ? "classic" : "ultimate";
    const {data, error} = await supabaseClient.rpc("create_game", {variant_: variant}).single();
    if (error) return setOnlineStatus(error.message, true);
    await enterRemoteGame(data);
    setOnlineStatus(`Code ${data.code} – warte auf Mitspieler …`);
}

async function joinOnlineGame() {
    if (!supabaseClient) return;
    const code = document.getElementById("gameCode").value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return setOnlineStatus("Bitte einen sechsstelligen Code eingeben.", true);
    const {data, error} = await supabaseClient.rpc("join_game", {code_: code}).single();
    if (error) return setOnlineStatus("Spiel nicht gefunden oder bereits gestartet.", true);
    await enterRemoteGame(data);
}

async function enterRemoteGame(game) {
    remoteGame = game;
    onlineMode = true;
    miniTicTacToe = game.variant === "classic";
    singlePlayer = false;
    gameActive = game.status === "active";
    fields = Array.from({length: 9}, () => Array(9).fill(0));
    bigFields = game.board_results.slice();
    document.querySelectorAll(".setup-control, #startButton").forEach(element => element.style.display = "none");
    document.getElementById("playerinfo").style.display = "block";
    document.getElementById("stopButton").style.display = "block";
    if (miniTicTacToe) {
        document.querySelectorAll(".big-grid-item").forEach((item, index) => item.style.display = index === 4 ? "grid" : "none");
        document.getElementById("mainGrid").style.gridTemplateColumns = "1fr";
    }
    await loadRemoteMoves();
    subscribeToRemoteGame();
    renderRemoteState();
}

async function loadRemoteMoves() {
    const {data, error} = await supabaseClient.from("moves").select("board,cell,mark").eq("game_id", remoteGame.id).order("id");
    if (error) return setOnlineStatus(error.message, true);
    fields = Array.from({length: 9}, () => Array(9).fill(0));
    data.forEach(move => fields[move.board][move.cell] = move.mark);
}

function subscribeToRemoteGame() {
    if (remoteChannel) supabaseClient.removeChannel(remoteChannel);
    remoteChannel = supabaseClient.channel(`game:${remoteGame.id}`)
        .on("postgres_changes", {event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${remoteGame.id}`}, payload => {
            remoteGame = payload.new; bigFields = remoteGame.board_results.slice(); renderRemoteState();
        })
        .on("postgres_changes", {event: "INSERT", schema: "public", table: "moves", filter: `game_id=eq.${remoteGame.id}`}, payload => {
            const move = payload.new; fields[move.board][move.cell] = move.mark; renderRemoteState();
        }).subscribe();
}

async function playRemoteMove(board, cell) {
    if (!remoteGame || remoteGame.status !== "active") return showHitbox("Das Online-Spiel ist noch nicht aktiv.", "bad");
    const myMark = remoteUserId === remoteGame.host_id ? X : O;
    if (remoteGame.current_mark !== myMark) return showHitbox("Dein Mitspieler ist am Zug.", "bad");
    const {data, error} = await supabaseClient.rpc("play_remote_move", {game_id_: remoteGame.id, board_: board, cell_: cell}).single();
    if (error) return showHitbox(error.message, "bad");
    fields[board][cell] = myMark;
    remoteGame = data; bigFields = data.board_results.slice(); renderRemoteState();
}

function renderRemoteState() {
    for (let board = 0; board < 9; board++) for (let cell = 0; cell < 9; cell++) {
        const element = document.getElementById(`${board + 1}-${cell + 1}`);
        const mark = fields[board][cell];
        element.textContent = mark === X ? "X" : mark === O ? "O" : "+";
        element.style.color = mark ? "black" : "#ccc";
        element.style.backgroundColor = "#ccc";
    }
    bigFields.forEach((result, board) => { if (result === X || result === O) showWinField(board, result); });
    gameActive = remoteGame.status === "active";
    bigGridItem = remoteGame.forced_board + 1;
    changeRedBorder();
    const myMark = remoteUserId === remoteGame.host_id ? X : O;
    document.getElementById("player").textContent = remoteGame.status === "waiting" ? "Warte …" : `Du bist ${myMark === X ? "X" : "O"} · ${remoteGame.current_mark === myMark ? "Du bist am Zug" : "Mitspieler ist am Zug"}`;
    setOnlineStatus(`Spielcode: ${remoteGame.code}${remoteGame.status === "finished" ? ` · ${remoteGame.winner === 0 ? "Unentschieden" : `${remoteGame.winner === myMark ? "Du hast" : "Dein Mitspieler hat"} gewonnen`}` : ""}`);
    if (remoteGame.status === "finished") endGame();
}

document.addEventListener("DOMContentLoaded", initializeMultiplayer);
