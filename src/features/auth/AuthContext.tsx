import { createContext, useContext, useState, type ReactNode } from 'react';
const Context=createContext({} as {email:string;setEmail:(value:string)=>void;notice:string;setNotice:(value:string)=>void;returnTo:string;setReturnTo:(value:string)=>void});
// Email and continuation state are deliberately memory-only; codes/passwords stay in the form.
export function AuthContext({children}:{children:ReactNode}) {
 const [email,setEmail]=useState(''),[notice,setNotice]=useState(''),[returnTo,setReturnTo]=useState('/dashboard');
 return <Context value={{email,setEmail,notice,setNotice,returnTo,setReturnTo}}>{children}</Context>;
}
export const useAuthFlow=()=>useContext(Context);
