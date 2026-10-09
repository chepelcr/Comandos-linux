import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { sessionStorage } from 'aws-amplify/utils';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import { config, authConfigured } from './config';
export type Student = { profile: { sub: string; email?: string; name?: string; username?: string }; access_token: string };
if(authConfigured) {
 Amplify.configure({Auth:{Cognito:{userPoolId:config.pool,userPoolClientId:config.client,loginWith:{email:true}}}});
 cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
}
export async function currentStudent(): Promise<Student | null> {
 if(!authConfigured)return null;
 try {const user=await getCurrentUser();const session=await fetchAuthSession();if(!session.tokens)return null;return {profile:{sub:user.userId,email:session.tokens.idToken?.payload.email as string|undefined,name:session.tokens.idToken?.payload.name as string|undefined,username:session.tokens.idToken?.payload.preferred_username as string|undefined},access_token:session.tokens.accessToken.toString()};}catch{return null;}
}
export const logout = async () => { const { endActiveLab } = await import('../services/labs'); try{await endActiveLab();}catch{throw new Error(document.documentElement.lang==='es'?'No se pudo finalizar el laboratorio. Reintenta cerrar sesión.':'Could not end your lab. Please retry signing out.');} await signOut(); };
export const freshToken = async () => (await fetchAuthSession()).tokens?.accessToken.toString();
