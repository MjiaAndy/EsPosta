console.log("EsPosta [Auth Bridge]: ¡Inicio de sesión exitoso! Notificando al Service Worker para cerrar esta pestaña.");
chrome.runtime.sendMessage({ type: "AUTH_SUCCESS" });