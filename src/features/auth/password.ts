// Keep this policy aligned with backend/infra/cognito.yml. Never normalize passwords.
export const passwordRules = (password: string) => ({
 length: [...password].length >= 12 && [...password].length <= 256,
 lower: /[a-z]/.test(password),
 upper: /[A-Z]/.test(password),
 number: /[0-9]/.test(password),
 symbol: /[\^$*.\[\]{}()?"!@#%&/\\,><':;|_~`=+\-]/.test(password),
});
export const passwordValid = (password: string) => Object.values(passwordRules(password)).every(Boolean) && !/^\s|\s$/.test(password);
export function safeReturnPath(value: unknown): string {
 if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\?#\u0000-\u0020]/.test(value)) return '/dashboard';
 const normalized=new URL(value,'https://linux.jcampos.dev').pathname;
 if(normalized!==value)return '/dashboard';
 if (/^\/(login|register|verify-email|forgot-password|reset-password|set-password|auth)(\/|$)/.test(value)) return '/dashboard';
 return value;
}
