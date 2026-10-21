export type ConsentValue = 'accept' | 'decline';
export type ConsentCategories = Record<string, boolean>;
export interface ConsentRecord {
	categories: ConsentCategories;
	timestamp: number;
}

export interface ConsentOptions {
	/** How long a stored choice stays valid, in days. Defaults to 365. */
	expiryDays?: number;
}

export function getConsent(category?: string, options?: ConsentOptions): ConsentValue | null;
export function getConsentRecord(options?: ConsentOptions): ConsentRecord | null;
export function setConsent(value: ConsentValue | ConsentCategories): ConsentRecord;
export function onConsentChange(callback: (record: ConsentRecord) => void): void;
export function whenAccepted(callback: () => void, category?: string): void;

export interface GateScriptOptions {
	src: string;
	async?: boolean;
	onLoad?: () => void;
	category?: string;
}
export function gateScript(options: GateScriptOptions): void;

export type ConsentModeType =
	| 'ad_storage'
	| 'ad_user_data'
	| 'ad_personalization'
	| 'analytics_storage'
	| 'functionality_storage'
	| 'personalization_storage'
	| 'security_storage';
/** Category id to the Google Consent Mode types it grants, for `<ConsentMode mapping>`. */
export type ConsentModeMapping = Record<string, ConsentModeType[]>;
