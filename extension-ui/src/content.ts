import { Readability } from '@mozilla/readability';

console.log("EsPosta [Content Script]: Cargado.");

const pageHTML = document.documentElement.innerHTML;
const parser = new DOMParser();
const newDocument = parser.parseFromString(pageHTML, 'text/html');
const article = new Readability(newDocument).parse();

if (article && article.textContent) {
  console.log("EsPosta [Content Script]: Artículo extraído:", article.title);
  chrome.runtime.sendMessage({
    type: "CONTENT_SCRIPT_RESULT",
    payload: {
      title: article.title,
      content: article.textContent,
    }
  });
} else {
  console.log("EsPosta [Content Script]: No se pudo extraer un artículo legible.");
}