const download = (entity, name) => {
  let encodedData = encodeURIComponent(entity);
  let dl = document.createElement("a");
  document.body.appendChild(dl);
  dl.setAttribute("href", "data:image/svg+xml;utf-8," + encodedData);
  dl.setAttribute("download", name);
  dl.click();
};

function translate(str) {
  if (window._t && typeof str === "string") {
    return window._t(str);
  }
  return str;
}

function pascalToKebabCase(string) {
  return (
    string &&
    string
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      )
      .map((x) => x.toLowerCase())
      .join("-")
  );
}

function getBool(val) {
  if (!val) return false;
  return !!JSON.parse(String(val).toLowerCase());
}

export { download, translate, pascalToKebabCase, getBool };
