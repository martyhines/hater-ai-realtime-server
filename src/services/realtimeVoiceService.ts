// realtimeVoiceService.ts
// Service for OpenAI Realtime Voice sessions (minimal WebRTC flow)

import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';
import { StorageService } from './storageService';
import { requestRealtimeToken } from './realtimeService';

let WebRTC: any = null;
try {
	// Lazy require to avoid breaking Expo Go when the module isn't present
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	WebRTC = require('react-native-webrtc');
} catch (e) {
	WebRTC = null;
}

const { RTCPeerConnection, mediaDevices } = WebRTC || {};

export interface RealtimeSessionInfo {
	isSupported: boolean;
	isEnabled: boolean;
	connected: boolean;
	error?: string;
}

class RealtimeVoiceService {
	private static instance: RealtimeVoiceService;
	private token: string | null = null;
	private connected = false;
	private pc: any = null;
	private remoteStream: any = null;
	private localStream: any = null;

	static getInstance(): RealtimeVoiceService {
		if (!RealtimeVoiceService.instance) {
			RealtimeVoiceService.instance = new RealtimeVoiceService();
		}
		return RealtimeVoiceService.instance;
	}

	isPlatformSupported(): boolean {
		return (Platform.OS === 'ios' || Platform.OS === 'android') && Boolean(RTCPeerConnection);
	}

	async getSessionInfo(): Promise<RealtimeSessionInfo> {
		const storage = StorageService.getInstance();
		const userSettings = await storage.getSettings();
		return {
			isSupported: this.isPlatformSupported(),
			isEnabled: Boolean(userSettings?.realtimeVoiceEnabled),
			connected: this.connected,
		};
	}

	async fetchEphemeralToken(): Promise<string> {
		const data = await requestRealtimeToken();
		const value = data?.client_secret?.value;
		if (!value) throw new Error('Invalid token response');
		this.token = value;
		return value;
	}

	private async getMicStream(): Promise<any> {
		if (!mediaDevices) throw new Error('WebRTC mediaDevices not available');
		return mediaDevices.getUserMedia({
			audio: true,
			video: false,
		});
	}

	async startSession(): Promise<void> {
		if (!this.isPlatformSupported()) {
			throw new Error('Realtime voice not supported on this platform/build');
		}
		if (!this.token) {
			await this.fetchEphemeralToken();
		}

		// Create peer connection
		this.pc = new RTCPeerConnection({
			iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
		});

		// Play remote audio track by attaching to a new MediaStream
		this.remoteStream = WebRTC ? new WebRTC.MediaStream() : null;
		if (this.remoteStream) {
			this.pc.ontrack = (event: any) => {
				const track = event.track;
				if (track.kind === 'audio') {
					this.remoteStream.addTrack(track);
				}
			};
		}

		// Get mic and add to PC
		this.localStream = await this.getMicStream();
		this.localStream.getTracks().forEach((t: any) => this.pc.addTrack(t, this.localStream));

		// Create SDP offer
		const offer = await this.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
		await this.pc.setLocalDescription(offer);

		// Send SDP to OpenAI Realtime, receive answer
		const resp = await fetch(
			`${API_CONFIG.REALTIME.BASE_URL}?model=${encodeURIComponent(API_CONFIG.REALTIME.MODEL)}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.token}`,
					'Content-Type': 'application/sdp',
				},
				body: offer.sdp,
			}
		);
		if (!resp.ok) {
			throw new Error(`Realtime SDP exchange failed: ${resp.status}`);
		}
		const answerSdp = await resp.text();
		await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

		this.connected = true;
	}

	getRemoteStream(): any | null {
		return this.remoteStream;
	}

	async stopSession(): Promise<void> {
		try {
			if (this.localStream) {
				this.localStream.getTracks().forEach((t: any) => t.stop());
			}
			if (this.pc) {
				this.pc.ontrack = null;
				this.pc.close();
			}
		} finally {
			this.pc = null;
			this.localStream = null;
			this.remoteStream = null;
			this.connected = false;
		}
	}
}

export default RealtimeVoiceService.getInstance();
