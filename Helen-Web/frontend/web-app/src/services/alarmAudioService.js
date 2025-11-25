/**
 * Alarm Audio Service
 * Handles playing alarm sounds when alarms trigger
 */

class AlarmAudioService {
    constructor() {
        this.audioContext = null;
        this.currentAlarm = null;
        this.audioElement = null;
    }

    /**
     * Initialize audio context (call on user interaction)
     */
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * Play alarm sound from MP3 file (loops until stopped)
     * Falls back to beep sound if file not found
     */
    async playAlarmSound() {
        try {
            // Stop any currently playing alarm
            this.stopAlarmSound();

            // Log when alarm sound starts playing
            console.log('Playing alarm sound...');

            // Try to load and play alarma.mp3
            this.audioElement = new Audio('/sounds/alarma.mp3');
            this.audioElement.loop = true;
            this.audioElement.volume = 0.8;

            // Try to play
            try {
                await this.audioElement.play();
                // Log successful playback of alarma.mp3
                console.log('Playing alarma.mp3');
            } catch (error) {
                // Warn if alarma.mp3 could not be played, fallback to beep
                console.warn('Could not play alarma.mp3, using fallback beep:', error);
                // Fallback to generated beep sound
                this.playBeepSound();
            }

        } catch (error) {
            // Log error if alarm sound fails to play
            console.error('Error playing alarm sound:', error);
            // Fallback to beep
            this.playBeepSound();
        }
    }

    /**
     * Play generated beep sound as fallback
     */
    playBeepSound() {
        try {
            const context = this.initAudioContext();
            
            // Log when fallback beep sound starts playing
            console.log('Playing fallback beep sound...');

            // Create an oscillator for the beep sound
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            // Set alarm sound properties (800Hz beep)
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            // Create repeating beep pattern (infinite until stopped)
            const beepDuration = 0.5;
            const pauseDuration = 0.3;
            
            gainNode.gain.setValueAtTime(0, context.currentTime);
            
            // Start infinite loop of beeps
            let time = context.currentTime;
            for (let i = 0; i < 100; i++) { // 100 beeps should be enough
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(0.3, time + 0.02);
                gainNode.gain.setValueAtTime(0.3, time + beepDuration - 0.02);
                gainNode.gain.linearRampToValueAtTime(0, time + beepDuration);
                time += beepDuration + pauseDuration;
            }

            oscillator.start(context.currentTime);

            // Store reference
            this.currentAlarm = { oscillator, gainNode, context };

        } catch (error) {
            // Log error if beep sound fails to play
            console.error('Error playing beep sound:', error);
        }
    }

    /**
     * Stop currently playing alarm
     */
    stopAlarmSound() {
        // Stop MP3 audio if playing
        if (this.audioElement) {
            try {
                this.audioElement.pause();
                this.audioElement.currentTime = 0;
                this.audioElement = null;
                // Log when MP3 alarm sound is stopped
                console.log('MP3 alarm sound stopped');
            } catch (error) {
                // Log error if stopping MP3 fails
                console.error('Error stopping MP3:', error);
            }
        }

        // Stop oscillator if playing
        if (this.currentAlarm) {
            try {
                const { oscillator, gainNode, context } = this.currentAlarm;
                
                // Fade out quickly
                gainNode.gain.cancelScheduledValues(context.currentTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, context.currentTime);
                gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);
                
                // Stop oscillator after fade
                oscillator.stop(context.currentTime + 0.1);
                
                this.currentAlarm = null;
                // Log when beep alarm sound is stopped
                console.log('Beep alarm sound stopped');
            } catch (error) {
                // Log error if stopping beep sound fails
                console.error('Error stopping beep sound:', error);
            }
        }
    }

    /**
     * Test alarm sound (shorter duration for testing)
     */
    testAlarmSound() {
        this.playAlarmSound();
        // Auto-stop after 3 seconds for testing
        setTimeout(() => this.stopAlarmSound(), 3000);
    }
}

// Singleton instance
const alarmAudioService = new AlarmAudioService();

export default alarmAudioService;
