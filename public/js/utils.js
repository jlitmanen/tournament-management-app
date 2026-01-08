import sanitizeHtml from 'sanitize-html';

export function formatContent(rawHtml) {
  if (!rawHtml) return "";

  // 1. Convert Markdown-style bullets (*) to HTML list items
  // We look for a line starting with * and turn it into <li>
  let formatted = rawHtml
    .replace(/^\* (.*)/gm, '<li>$1</li>') // Convert lines starting with *
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>'); // Wrap group of <li> in <ul>

  // 2. Sanitize (Allowing ul and li now)
  const clean = sanitizeHtml(formatted, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {
      'a': ['href', 'target']
    }
  });

  // 3. Convert remaining newlines to <br /> (for the header text)
  return clean.replace(/\n/g, '<br />');
}
