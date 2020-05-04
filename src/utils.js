const download = (entity, name) => {
  let encodedData = encodeURIComponent(entity);
  let dl = document.createElement("a");
  document.body.appendChild(dl);
  dl.setAttribute("href", "data:image/svg+xml;utf-8," + encodedData);
  dl.setAttribute("download", name);
  dl.click();
};

export { download };
