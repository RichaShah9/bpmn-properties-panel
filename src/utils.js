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
  if (!val || !["false", "true", true, false].includes(val)) return false;
  return !!JSON.parse(String(val).toLowerCase());
}

function sortBy(array = [], key) {
  return array.sort(function (a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

function getItemsByType(view, type) {
  function collectItems(item) {
    const { items = [], jsonFields = [] } = item;
    const allItems = [...items, ...jsonFields];
    return allItems.reduce(
      (all, item) => [...all, ...collectItems(item)],
      item.type === type ? [item] : []
    );
  }
  return collectItems(view);
}

function getLowerCase(str) {
  if (!str) return;
  return str.trim().toLowerCase();
}

function getFormName(str) {
  if (!str) return;
  const formString = str.match(/[A-Z][a-z]+/g);
  if (!formString) return;
  if (formString.join("").trim().length !== str.length) {
    return "fetchAPI";
  }
  const form = formString && formString.join("-");
  return `${form.toLowerCase()}-form`;
}

export {
  download,
  translate,
  pascalToKebabCase,
  getBool,
  sortBy,
  getItemsByType,
  getFormName,
  getLowerCase,
};
