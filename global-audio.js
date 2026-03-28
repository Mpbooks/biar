// global-audio.js
(function() {
    // Check se já existe na página para não duplicar
    if(document.getElementById('global-sound-control')) return;

    // Identifica quão profundo estamos na pasta para ajustar o caminho absoluto da playlist
    const pathParts = window.location.pathname.split('/');
    const pagesIndex = pathParts.indexOf('pages');
    let prefix = './';
    if(pagesIndex !== -1) {
        const steps = pathParts.length - 1 - pagesIndex;
        prefix = '../'.repeat(steps);
    }

    // Injeta o CSS do reprodutor e Modal
    const style = document.createElement('style');
    style.innerHTML = `
        .global-sound-control {
            display: inline-flex;
            flex-direction: column;
            align-items: flex-end; 
            font-family: sans-serif;
            color: #686868;
            width: 120px;
            position: fixed; 
            right: 5%;
            bottom: 5%;
            z-index: 9999; 
        }

        .global-sound-control .label-top {
            display: flex;
            justify-content: space-between;
            width: 100%;
        }

        .global-sound-control .label-top span {
            font-size: 10px;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        #btn-custom-playlist {
            cursor: pointer;
            text-decoration: underline;
            transition: color 0.3s;
        }

        #btn-custom-playlist:hover {
            color: #fff;
        }

        .global-sound-control .line-container {
            width: 100%;
            height: 1px;
            background-color: #333; 
            position: relative;
            margin-bottom: 8px;
        }

        .global-sound-control .progress-line {
            width: 0%; 
            height: 100%;
            background-color: #F4EDE6; 
            transition: width 0.3s ease;
        }

        .global-sound-control .controls {
            width: 100%;
            display: flex;
            justify-content: space-between;
        }

        .global-sound-control .controls button {
            background: none;
            border: none;
            color: #686868;
            font-size: 12px;
            cursor: pointer;
            padding: 0;
            transition: color 0.3s;
        }

        .global-sound-control .controls button.active {
            color: #F4EDE6;
        }

        .global-sound-control.is-playing .progress-line {
            width: 60%; 
        }

        .global-sound-control .audio-toggles {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .global-sound-control .audio-toggles button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 10px;
            opacity: 0.4;
            color: #686868;
            transition: all 0.3s;
            padding: 0;
        }

        .global-sound-control .audio-toggles button.active {
            opacity: 1;
            color: #F4EDE6;
            text-shadow: 0 0 5px rgba(244, 237, 230, 0.5);
        }

        /* Modal Styles */
        .audio-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        .audio-modal-overlay.active {
            opacity: 1; pointer-events: auto;
        }
        .audio-modal-content {
            background: rgba(20, 20, 20, 0.85); border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 30px; border-radius: 16px; width: 90%; max-width: 400px;
            color: #F4EDE6; font-family: sans-serif; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            text-align: left;
        }
        .audio-modal-close {
            position: absolute; top: 15px; right: 15px; background: none; border: none;
            color: #F4EDE6; font-size: 16px; cursor: pointer;
        }
        .audio-modal-content h3 { margin-top: 0; font-size: 18px; margin-bottom: 10px; font-weight: 500;}
        .audio-modal-content p { font-size: 12px; color: #aaa; margin-bottom: 20px; line-height: 1.4; }
        .audio-upload-area {
            border: 1px dashed rgba(255,255,255,0.3); border-radius: 8px; padding: 30px 10px;
            text-align: center; cursor: pointer; font-size: 12px; color: #F4EDE6; transition: all 0.3s;
        }
        .audio-upload-area:hover { border-color: #F4EDE6; background: rgba(255,255,255,0.05); }
        .audio-playlist-list { margin-top: 20px; max-height: 150px; overflow-y: auto; font-size: 11px; color: #aaa; }
        .audio-playlist-list div { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .audio-btn-clear {
            margin-top: 15px; width: 100%; padding: 10px; background: rgba(255,50,50,0.1);
            color: #ff5555; border: 1px solid rgba(255,50,50,0.3); border-radius: 6px;
            cursor: pointer; transition: all 0.2s;
        }
        .audio-btn-clear:hover { background: rgba(255,50,50,0.2); }
    `;
    document.head.appendChild(style);

    // Injeta o HTML
    const soundControlHTML = `
        <div class="global-sound-control" id="global-sound-control">
            <div class="label-top">
                <span id="btn-custom-playlist">New</span>
                <span>SOUND</span>
            </div>
            <div class="line-container">
                <div class="progress-line"></div>
            </div>
            <div class="controls" style="align-items: center;">
                <button id="btn-global-off" class="active">OFF</button>
                <div class="audio-toggles">
                    <button id="btn-audio-repeat" title="Repetir Música">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                    </button>
                    <button id="btn-audio-shuffle" title="Ordem Aleatória">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                    </button>
                </div>
                <button id="btn-global-on">ON</button>
            </div>
            <audio id="globalAudio"></audio>
        </div>

        <div id="audio-modal" class="audio-modal-overlay">
            <div class="audio-modal-content">
                <button class="audio-modal-close" id="audio-modal-close">✕</button>
                <h3>My Playlist</h3>
                <p>Upload your own music (mp3/wav) to override the default tracks. Files are stored entirely on your device and will play across all pages.</p>
                <input type="file" id="audio-file-input" multiple accept="audio/*" style="display:none;">
                <div class="audio-upload-area" id="audio-dropzone">
                    <span>Click here to select audio files</span>
                </div>
                <div class="audio-playlist-list" id="audio-playlist-list"></div>
                <button class="audio-btn-clear" id="audio-btn-clear" style="display:none;">Reset to Default Music</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', soundControlHTML);

    const defaultPlaylist = [
        prefix + "playlist/musica2.mp3",
        prefix + "playlist/musica3.mp3"
    ];

    let currentPlaylist = [...defaultPlaylist];
    let isCustom = false;
    let customObjectUrls = [];

    // --- IndexedDB Logic ---
    const DB_NAME = 'BiarAudioDB';
    const STORE_NAME = 'custom_playlist';

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { autoIncrement: true });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function saveCustomFiles(filesList) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        // Removido store.clear() para não deletar as antigas!
        for (const file of filesList) {
            store.add(file);
        }
        return new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }

    async function getCustomFiles() {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = reject;
        });
    }

    async function clearCustomFiles() {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        return new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }

    // --- UI and Audio Logic ---
    const audio = document.getElementById('globalAudio');
    const btnOn = document.getElementById('btn-global-on');
    const btnOff = document.getElementById('btn-global-off');
    const container = document.getElementById('global-sound-control');
    
    // Modal Elements
    const modal = document.getElementById('audio-modal');
    const btnNew = document.getElementById('btn-custom-playlist');
    const btnClose = document.getElementById('audio-modal-close');
    const dropzone = document.getElementById('audio-dropzone');
    const fileInput = document.getElementById('audio-file-input');
    const listDiv = document.getElementById('audio-playlist-list');
    const btnClear = document.getElementById('audio-btn-clear');
    const btnRepeat = document.getElementById('btn-audio-repeat');
    const btnShuffle = document.getElementById('btn-audio-shuffle');

    let currentTrack = parseInt(localStorage.getItem('biar_audioTrack')) || 0;
    let isPlaying = localStorage.getItem('biar_audioPlaying') === 'true';
    let savedTime = parseFloat(localStorage.getItem('biar_audioTime')) || 0;
    
    let isRepeat = localStorage.getItem('biar_audioRepeat') === 'true';
    let isShuffle = localStorage.getItem('biar_audioShuffle') === 'true';

    // Inicializa interface dos novos botões
    if(isRepeat) btnRepeat.classList.add('active');
    if(isShuffle) btnShuffle.classList.add('active');

    btnRepeat.addEventListener('click', () => {
        isRepeat = !isRepeat;
        localStorage.setItem('biar_audioRepeat', isRepeat);
        btnRepeat.classList.toggle('active', isRepeat);
    });

    btnShuffle.addEventListener('click', () => {
        isShuffle = !isShuffle;
        localStorage.setItem('biar_audioShuffle', isShuffle);
        btnShuffle.classList.toggle('active', isShuffle);
    });

    function renderList(files) {
        listDiv.innerHTML = '';
        if (files && files.length > 0) {
            files.forEach(f => {
                const item = document.createElement('div');
                item.textContent = "🎵 " + f.name;
                listDiv.appendChild(item);
            });
            btnClear.style.display = 'block';
        } else {
            btnClear.style.display = 'none';
        }
    }

    function loadTrack(index) {
        if(index >= currentPlaylist.length) {
            index = 0;
            currentTrack = 0;
            localStorage.setItem('biar_audioTrack', index);
        }
        audio.src = currentPlaylist[index];
        audio.load();
    }

    function updateUI(playing) {
        if (playing) {
            container.classList.add('is-playing');
            btnOn.classList.add('active');
            btnOff.classList.remove('active');
        } else {
            container.classList.remove('is-playing');
            btnOff.classList.add('active');
            btnOn.classList.remove('active');
        }
    }

    function controlAudio(state, resumeTime = 0) {
        if (state === 'on') {
            if (resumeTime > 0) audio.currentTime = resumeTime;
            audio.play().then(() => {
                updateUI(true);
                localStorage.setItem('biar_audioPlaying', 'true');
            }).catch(error => {
                console.log("Audio autoplay prevented:", error);
                updateUI(false);
                localStorage.setItem('biar_audioPlaying', 'false');
            });
        } else {
            audio.pause();
            updateUI(false);
            localStorage.setItem('biar_audioPlaying', 'false');
        }
    }

    btnOn.addEventListener('click', () => {
        if (audio.currentTime === 0 && isShuffle && currentPlaylist.length > 1) {
            currentTrack = Math.floor(Math.random() * currentPlaylist.length);
            localStorage.setItem('biar_audioTrack', currentTrack);
            loadTrack(currentTrack);
        }
        controlAudio('on');
    });
    btnOff.addEventListener('click', () => controlAudio('off'));

    audio.addEventListener('ended', () => {
        if (isRepeat) {
            // Continua na mesma música
            audio.currentTime = 0;
        } else if (isShuffle) {
            // Sorteia uma música diferente (se houver mais de uma)
            if (currentPlaylist.length > 1) {
                let nextTrack;
                do {
                    nextTrack = Math.floor(Math.random() * currentPlaylist.length);
                } while (nextTrack === currentTrack);
                currentTrack = nextTrack;
            }
        } else {
            // Próxima normal
            currentTrack++;
            if (currentTrack >= currentPlaylist.length) currentTrack = 0;
        }

        localStorage.setItem('biar_audioTrack', currentTrack);
        loadTrack(currentTrack);
        controlAudio('on');
    });

    audio.addEventListener('timeupdate', () => {
        if (!audio.paused) localStorage.setItem('biar_audioTime', audio.currentTime);
    });

    // --- Modal events ---
    btnNew.addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    btnClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            await saveCustomFiles(filesArray);
            
            if (!isCustom) {
                // Primeira vez adicionando: substitui a playlist default e reseta a música
                await applyCustomPlaylist(filesArray, false);
            } else {
                // Já existem músicas customizadas: apenas anexa à playlist
                await applyCustomPlaylist(filesArray, true);
            }
            
            modal.classList.remove('active');
        }
    });

    btnClear.addEventListener('click', async () => {
        await clearCustomFiles();
        isCustom = false;
        currentPlaylist = [...defaultPlaylist];
        customObjectUrls.forEach(url => URL.revokeObjectURL(url));
        customObjectUrls = [];
        renderList([]);
        currentTrack = 0;
        localStorage.setItem('biar_audioTrack', 0);
        localStorage.setItem('biar_audioTime', 0);
        loadTrack(0);
        controlAudio('on');
        modal.classList.remove('active');
    });

    async function applyCustomPlaylist(files, isAppending = false) {
        isCustom = true;
        
        if (!isAppending) {
            customObjectUrls.forEach(url => URL.revokeObjectURL(url));
            customObjectUrls = [];
            currentPlaylist = [];
        }

        for (const file of files) {
            const url = URL.createObjectURL(file);
            customObjectUrls.push(url);
            currentPlaylist.push(url);
        }

        // Renderiza a lista visual baseada no que está no DB
        const allFiles = await getCustomFiles();
        renderList(allFiles);

        if (!isAppending) {
            currentTrack = 0;
            localStorage.setItem('biar_audioTrack', 0);
            localStorage.setItem('biar_audioTime', 0);
            loadTrack(0);
            controlAudio('on');
        } else {
            // Se for a PRIMEIRA VEZ adicionando (currentPlaylist pulou de 0 para >0)
            // Precisamos tocar, senão a música já está tocando
            if (currentPlaylist.length === files.length) {
                currentTrack = 0;
                localStorage.setItem('biar_audioTrack', 0);
                localStorage.setItem('biar_audioTime', 0);
                loadTrack(0);
                controlAudio('on');
            }
        }
    }

    // --- Initialization ---
    async function init() {
        try {
            const customFiles = await getCustomFiles();
            if (customFiles && customFiles.length > 0) {
                isCustom = true;
                currentPlaylist = [];
                for (const file of customFiles) {
                    const url = URL.createObjectURL(file);
                    customObjectUrls.push(url);
                    currentPlaylist.push(url);
                }
                renderList(customFiles);
            }
        } catch (err) {
            console.error("IndexedDB error:", err);
        }

        // Importante forçar load da track certa antes de dar play!
        loadTrack(currentTrack);

        if(isPlaying) {
            controlAudio('on', savedTime);
            const unlockAudio = () => {
                if(audio.paused && localStorage.getItem('biar_audioPlaying') === 'true') {
                    controlAudio('on', parseFloat(localStorage.getItem('biar_audioTime')) || 0);
                }
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            };
            document.addEventListener('click', unlockAudio, {once:true});
            document.addEventListener('touchstart', unlockAudio, {once:true});
        } else {
            updateUI(false);
        }
    }

    init();
})();
