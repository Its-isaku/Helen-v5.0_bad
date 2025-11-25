/**
 * Alarm service: Manages alarm operations
 * WEB VERSION with persistent scheduler
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb(...args));
  }
}

class AlarmService extends EventEmitter {
    constructor() {
        super();
        
        this.schedulerInterval = null;
        this.isSchedulerRunning = false;
        this.audioContext = null;
        this.triggeredAlarms = new Set(); // Track triggered alarms to avoid repetition
        
        // Auto-start scheduler
        this.startScheduler();
    }

    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getAlarms() {
        try {
            const stored = localStorage.getItem('alarms');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading alarms:', e);
            return [];
        }
    }

    saveAlarms(alarms) {
        try {
            localStorage.setItem('alarms', JSON.stringify(alarms));
        } catch (e) {
            console.error('Error saving alarms:', e);
        }
    }

    async getAllAlarms() {
        return this.getAlarms();
    }

    async fetchAlarms() {
        return this.getAllAlarms();
    }

    async getAlarm(id) {
        const alarms = this.getAlarms();
        return alarms.find(alarm => alarm.id === id);
    }

    async createAlarm(alarmData) {
        const newAlarm = {
            id: this.generateId(),
            time: alarmData.time,
            label: alarmData.label || 'Alarma',
            days: alarmData.days || [],
            isEnabled: alarmData.enabled !== undefined ? alarmData.enabled : true,
            sound: alarmData.sound || '/sounds/alarma.mp3',
            createdAt: new Date().toISOString(),
        };

        const alarms = this.getAlarms();
        alarms.push(newAlarm);
        this.saveAlarms(alarms);

        this.emit('alarm:created', newAlarm);

        return newAlarm;
    }

    async updateAlarm(id, updates) {
        const alarms = this.getAlarms();
        const index = alarms.findIndex(alarm => alarm.id === id);

        if (index === -1) {
            throw new Error(`Alarm ${id} not found`);
        }

        alarms[index] = {
            ...alarms[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        this.saveAlarms(alarms);
        this.emit('alarm:updated', alarms[index]);

        return alarms[index];
    }

    async deleteAlarm(id) {
        let alarms = this.getAlarms();
        const filtered = alarms.filter(alarm => alarm.id !== id);

        if (filtered.length === alarms.length) {
            throw new Error(`Alarm ${id} not found`);
        }

        this.saveAlarms(filtered);
        this.emit('alarm:deleted', id);

        return true;
    }

    async toggleAlarm(id) {
        const alarms = this.getAlarms();
        const alarm = alarms.find(a => a.id === id);

        if (!alarm) {
            throw new Error(`Alarm ${id} not found`);
        }

        return this.updateAlarm(id, { isEnabled: !alarm.isEnabled });
    }

    startScheduler() {
        if (this.isSchedulerRunning) {
            return;
        }

        // Check immediately on start
        this.checkAlarms();

        // Then check every 5 seconds
        this.schedulerInterval = setInterval(() => {
            this.checkAlarms();
        }, 5000);

        this.isSchedulerRunning = true;
    }

    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }

        this.isSchedulerRunning = false;
    }

    async checkAlarms() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Convert JS day (0=Sunday, 1=Monday, ..., 6=Saturday)
        // to our format (0=Monday, 1=Tuesday, ..., 6=Sunday)
        const jsDay = now.getDay();
        const currentDay = jsDay === 0 ? 6 : jsDay - 1;
        
        const alarms = this.getAlarms();

        for (const alarm of alarms) {
            if (!alarm.isEnabled) continue;

            // Check if alarm should repeat today
            if (alarm.days && alarm.days.length > 0) {
                const shouldTrigger = alarm.days.includes(currentDay);
                if (!shouldTrigger) {
                    continue;
                }
            }

            // Convert alarm time to HH:MM format
            let alarmTime = alarm.time;
            if (alarm.time.includes('T')) {
                const date = new Date(alarm.time);
                alarmTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }

            if (currentTime === alarmTime) {
                // Check if already triggered this minute
                const alarmKey = `${alarm.id}-${currentTime}`;
                if (this.triggeredAlarms.has(alarmKey)) {
                    continue; // Already triggered this minute
                }
                
                this.triggeredAlarms.add(alarmKey);
                this.triggerAlarm(alarm);
                
                // Clean up old triggered alarms after 2 minutes
                setTimeout(() => {
                    this.triggeredAlarms.delete(alarmKey);
                }, 120000);
            }
        }
    }

    triggerAlarm(alarm) {
        this.emit('alarm:triggered', alarm);

        // Note: Sound is played by AlarmNotificationContext.jsx to avoid duplicate audio
        // this.playAlarmSound(alarm.sound);

        // Show notification
        this.showNotification(alarm);
    }

    playAlarmSound(soundPath) {
        try {
            const audio = new Audio(soundPath);
            audio.loop = false;
            audio.volume = 1.0;
            
            // Try to play
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Sound playing successfully
                    })
                    .catch(() => {
                        // Fallback: beep
                        this.playBeep();
                    });
            }
        } catch {
            this.playBeep();
        }
    }

    playBeep() {
        // Fallback beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 880; // A5 note - high and perceptible
            oscillator.type = 'square'; // Square wave for a more noticeable sound

            // Beep pattern: 3 beeps
            const beepDuration = 0.2;
            const pauseDuration = 0.15;
            
            // First beep
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + beepDuration);
            
            // Second beep
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + beepDuration + pauseDuration);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + beepDuration * 2 + pauseDuration);
            
            // Third beep
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + beepDuration * 2 + pauseDuration * 2);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + beepDuration * 3 + pauseDuration * 2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + beepDuration * 3 + pauseDuration * 2);
        } catch (e) {
            // Log error if beep sound fails to play
            console.error('Error playing beep:', e);
        }
    }

    showNotification(alarm) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Alarma', {
                body: alarm.label || 'Es hora!',
                icon: '/vite.svg',
                requireInteraction: true,
            });
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }
}

const alarmService = new AlarmService();
export default alarmService;
export { alarmService };