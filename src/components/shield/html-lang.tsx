/**
 * Sets the document element's language and direction.
 *
 * Next.js renders one root layout for the whole site, and a root layout
 * cannot read the route segment without turning every page dynamic — so
 * the served `<html>` element carries the default language and this tiny
 * inline script corrects it before the page paints. The page content
 * itself is wrapped in an element with the right `lang` and `dir`, so the
 * served HTML is never ambiguous (14, section 5).
 */
export function HtmlLang({ lang, dir }: { lang: string; dir: string }) {
  const script = `document.documentElement.lang=${JSON.stringify(lang)};document.documentElement.dir=${JSON.stringify(dir)};`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
