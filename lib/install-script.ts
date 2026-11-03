/**
 * Inline-Skript fürs Root-Layout: fängt beforeinstallprompt so früh wie möglich ab (feuert oft
 * vor der Hydration) und meldet Änderungen per Event an den Store in lib/install.ts.
 * Eigene Datei ohne "use client", damit der String im Server-Layout ankommt.
 */
export const INSTALL_CAPTURE_SCRIPT = `(function(){try{
var f=function(){window.dispatchEvent(new Event("sd-install-change"))};
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__sdInstall=e;f()});
window.addEventListener("appinstalled",function(){window.__sdInstall=null;window.__sdInstalled=true;f()});
}catch(e){}})();`;
