/**
 * Discord Quest Completer
 * runs entirely in the client console. safe, no dependencies, no token required.
 * by: n.oci (ur daddy btw)
 */

(() => {
    const c = {
        reset: "\x1b[0m", 
        white: "\x1b[97m", 
        grey: "\x1b[90m", 
        darkGrey: "\x1b[38;5;236m",
        green: "\x1b[32m", 
        red: "\x1b[31m",
        yellow: "\x1b[33m"
    };

    const log = {
        system: (msg) => console.log(`${c.grey}[#]${c.reset} ${msg}`),
        warn: (msg) => console.log(`${c.yellow}[!]${c.reset} ${msg}`),
        err: (msg) => console.log(`${c.red}[-]${c.reset} ${msg}`)
    };

    const playSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            // helper to play a single note
            const playNote = (freq, startTime, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'triangle'; // sounds brighter and louder than sine
                osc.frequency.value = freq;
                
                // volume envelope (fast attack, smooth decay)
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            const now = ctx.currentTime;
            
            // "ta-da" chord (C5, E5, G5)
            playNote(523.25, now, 0.15);        
            playNote(659.25, now + 0.15, 0.15); 
            playNote(783.99, now + 0.30, 0.6);  
            
        } catch (e) {}
    };

    const notify = (title, body) => {
        try {
            if (!("Notification" in window)) return;
            if (Notification.permission === "granted") {
                new Notification(title, { body });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") new Notification(title, { body });
                });
            }
        } catch (e) {}
    };

    // draws the progress bar
    const drawBar = (current, total, length = 25) => {
        const percent = Math.min(1, current / total);
        const filled = Math.round(length * percent);
        const empty = length - filled;
        const bar = `${c.white}${"█".repeat(filled)}${c.darkGrey}${"░".repeat(empty)}${c.reset}`;
        return `[${bar}] ${Math.round(percent * 100)}%`;
    };

    // renders the main terminal UI
    const drawUI = (questName, taskName, done, needed, completedCount, totalQuests, timeLeft) => {
        console.clear();
        
        console.log(`\n${c.grey}════════════════════════════════════════════════════════════${c.reset}`);
        console.log(` ${c.white}General Progress: ${completedCount} / ${totalQuests} quests${c.reset}`);
        console.log(`${c.grey}════════════════════════════════════════════════════════════${c.reset}\n`);
        
        console.table({
            "Current Quest": questName,
            "Task": taskName,
            "Status": `${done} / ${needed} seconds`,
            "Next tick": `${timeLeft}s`
        });

        console.log(`\n ${c.grey}▶${c.reset} ${drawBar(done, needed)}`);
        
        console.log(`\n${c.grey}════════════════════════════════════════════════════════════${c.reset}`);
        console.log(` ${c.darkGrey}ocean's tool${c.reset} ${c.grey}· discord quest auto-completer${c.reset}`);
        console.log(`${c.grey}════════════════════════════════════════════════════════════${c.reset}\n`);
    };

    log.system("searching for internal modules...");

    // hook into discord's internal webpack modules
    let QuestsStore, ChannelStore, GuildChannelStore, api;
    try {
        let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
        webpackChunkdiscord_app.pop();
        
        const modules = Object.values(wpRequire.c);
        
        QuestsStore = modules.find(x => x?.exports?.A?.__proto__?.getQuest)?.exports?.A;
        ChannelStore = modules.find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports?.A;
        GuildChannelStore = modules.find(x => x?.exports?.Ay?.getSFWDefaultChannel)?.exports?.Ay;
        api = modules.find(x => x?.exports?.Bo?.get)?.exports?.Bo;
    } catch (e) {
        log.err("failed to access webpack modules. are you in the desktop client console?");
        return;
    }

    if (!QuestsStore || !api) {
        log.err("quest modules not found. discord may have updated their webpack.");
        return;
    }

    const SUPPORTED_TASKS = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
    
    const getUncompletedQuests = () => {
        return [...QuestsStore.quests.values()].filter(q => {
            const isEnrolled = q.userStatus?.enrolledAt;
            const isDone = q.userStatus?.completedAt;
            const notExpired = new Date(q.config.expiresAt).getTime() > Date.now();
            const taskConfig = q.config.taskConfig ?? q.config.taskConfigV2;
            const hasValidTask = SUPPORTED_TASKS.some(t => Object.keys(taskConfig?.tasks ?? {}).includes(t));
            return isEnrolled && !isDone && notExpired && hasValidTask;
        });
    };

    const getProgress = (quest, taskName) => {
        return quest.userStatus?.progress?.[taskName]?.value ?? 0;
    };

    const waitWithUI = async (seconds, questName, taskName, done, needed, completedCount, totalQuests) => {
        for (let i = seconds; i > 0; i--) {
            drawUI(questName, taskName, done, needed, completedCount, totalQuests, i);
            await new Promise(r => setTimeout(r, 1000));
        }
    };

    const completeVideoQuest = async (quest, taskName, needed, questName, completedCount, totalQuests) => {
        let done = getProgress(quest, taskName);
        
        while (done < needed) {
            await waitWithUI(7, questName, taskName, done, needed, completedCount, totalQuests); 
            done = Math.min(needed, done + 7);
            
            try {
                const res = await api.post({
                    url: `/quests/${quest.id}/video-progress`,
                    body: { timestamp: Math.min(needed, done + Math.random()) }
                });
                if (res.body?.completed_at) break;
            } catch (e) {}
        }
    };

    const completeApiQuest = async (quest, taskName, needed, questName, completedCount, totalQuests) => {
        let done = getProgress(quest, taskName);

        // grab a random channel id to simulate the stream key
        const channelId = ChannelStore?.getSortedPrivateChannels?.()?.[0]?.id ?? 
                          Object.values(GuildChannelStore?.getAllGuilds?.() ?? {}).find(x => x != null && x.VOCAL?.length > 0)?.VOCAL[0]?.channel?.id ?? 
                          "0";
        const streamKey = `call:${channelId}:1`;

        while (done < needed) {
            await waitWithUI(20, questName, taskName, done, needed, completedCount, totalQuests);
            
            try {
                const res = await api.post({
                    url: `/quests/${quest.id}/heartbeat`,
                    body: { stream_key: streamKey, terminal: false }
                });
                
                const currentProg = res.body?.progress?.[taskName]?.value ?? (done + 20);
                done = Math.min(needed, currentProg);

                if (done >= needed) {
                    // send final heartbeat to mark as complete
                    await api.post({
                        url: `/quests/${quest.id}/heartbeat`,
                        body: { stream_key: streamKey, terminal: true }
                    });
                    break;
                }
            } catch (e) {}
        }
    };

    const run = async () => {
        const quests = getUncompletedQuests();
        
        if (quests.length === 0) {
            log.warn("no pending quests found.");
            return;
        }

        let completedCount = 0;
        const totalQuests = quests.length;

        for (const quest of quests) {
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
            const taskName = SUPPORTED_TASKS.find(t => taskConfig?.tasks?.[t] != null);
            
            if (!taskName) continue;
            const target = taskConfig.tasks[taskName].target;
            const questName = quest.config.messages?.questName ?? "Unknown";

            if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                await completeVideoQuest(quest, taskName, target, questName, completedCount, totalQuests);
            } else {
                await completeApiQuest(quest, taskName, target, questName, completedCount, totalQuests);
            }
            
            completedCount++;
            await new Promise(r => setTimeout(r, 1000));
        }
        
        console.clear();
        console.log(`\n${c.grey}════════════════════════════════════════════════════════════${c.reset}`);
        console.log(` ${c.white}ALL DONE!${c.reset}`);
        console.log(`${c.grey}════════════════════════════════════════════════════════════${c.reset}\n`);
        console.log(` ${c.grey}Successfully completed ${c.white}${completedCount}${c.grey} out of ${c.white}${totalQuests}${c.grey} quests.${c.reset}\n`);
        console.log(`${c.grey}════════════════════════════════════════════════════════════${c.reset}`);
        console.log(` ${c.darkGrey}ocean's tool${c.reset} ${c.grey}· discord quest auto-completer${c.reset}`);
        console.log(`${c.grey}════════════════════════════════════════════════════════════${c.reset}\n`);
        
        playSound();
        notify("Discord Quests", `Done! Completed ${completedCount} quests.`);
    };

    run();
})();
