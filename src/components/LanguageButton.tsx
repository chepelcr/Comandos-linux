export function LanguageButton({language,onChange}:{language:string;onChange:(language:'es'|'en')=>void}) {
 const spanish=language.startsWith('es');
 return <button className="icon-button language-button" aria-label={spanish?'Switch to English':'Cambiar a español'} title={spanish?'English':'Español'} onClick={()=>onChange(spanish?'en':'es')}>
  <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true"><rect width="26" height="18" rx="2" fill="white"/>{spanish?<><path fill="#002b7f" d="M0 0h26v3H0zM0 15h26v3H0z"/><path fill="#ce1126" d="M0 6h26v6H0z"/></>:<><path stroke="#b22234" strokeWidth="1.4" d="M0 .7h26M0 3.5h26M0 6.3h26M0 9.1h26M0 11.9h26M0 14.7h26M0 17.5h26"/><path fill="#3c3b6e" d="M0 0h11v9.8H0z"/><path fill="white" d="M2 1h1v1H2zM5 1h1v1H5zM8 1h1v1H8zM3 3h1v1H3zM7 3h1v1H7zM2 5h1v1H2zM5 5h1v1H5zM8 5h1v1H8zM3 7h1v1H3zM7 7h1v1H7z"/></>}</svg>
  <span className="sr-only">{spanish?'Costa Rica':'United States'}</span>
 </button>;
}
