export type ConsentValue = 'accept' | 'decline';

export function getConsent(): ConsentValue | null;
export function setConsent(value: ConsentValue): void;
export function onConsentChange(callback: (value: ConsentValue) => void): void;
export function whenAccepted(callback: () => void): void;

export interface GateScriptOptions {
	src: string;
	async?: boolean;
	onLoad?: () => void;
}
export function gateScript(options: GateScriptOptions): void;
