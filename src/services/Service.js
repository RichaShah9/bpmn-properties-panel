let lastCookieString;
let lastCookies = {};

function readCookie(name) {
  let cookieString = document.cookie || "";
  if (cookieString !== lastCookieString) {
    lastCookieString = cookieString;
    lastCookies = cookieString.split("; ").reduce((obj, value) => {
      let parts = value.split("=");
      obj[parts[0]] = parts[1];
      return obj;
    }, {});
  }
  return lastCookies[name];
}

export class Service {
  constructor() {
    const headers = new Headers();
    headers.append("Accept", "application/json");
    headers.append("Content-Type", "application/json");
    headers.append("X-Requested-With", "XMLHttpRequest");
    headers.append("X-CSRF-Token", readCookie("CSRF-TOKEN"));
    this.baseURL = process.env.NODE_ENV === "production" ? ".." : "bpm-demo";
    this.headers = headers;
  }

  fetch(url, method, options) {
    return fetch(url, options)
      .then((data) => {
        if (["head", "delete"].indexOf(method.toLowerCase()) !== -1)
          return data;
        let isJSON = data.headers
          .get("content-type")
          .includes("application/json");
        return isJSON ? data.json() : data;
      })
      .catch((err) => {});
  }

  request(url, config = {}, data = {}) {
    const options = Object.assign(
      {
        method: "POST",
        credentials: "include",
        headers: this.headers,
        mode: "cors",
        body: JSON.stringify(data),
      },
      config
    );
    if (config.method === "GET") {
      delete options.body;
    }
    return this.fetch(
      `${this.baseURL}${url.indexOf("/") === 0 ? url : `/${url}`}`,
      config.method,
      options
    );
  }

  post(url, data) {
    const config = {
      method: "POST",
    };
    return this.request(url, config, data);
  }

  add(entity, record) {
    const data = {
      data: record,
    };
    const url = `ws/rest/${entity}`;
    return this.post(url, data);
  }

  fetchId(entity, id, data = {}) {
    const url = `ws/rest/${entity}/${id}/fetch`;
    return this.post(url, data);
  }

  sync(url, method, data) {
    var request = new XMLHttpRequest();
    request.open(
      method,
      `${this.baseURL}${url.indexOf("/") === 0 ? url : `/${url}`}`,
      false
    );
    for (var [key, value] of this.headers.entries()) {
      request.setRequestHeader(key, value);
    }
    request.send(method.toLowerCase() === "post" ? JSON.stringify(data) : null);
    if (request.status === 200) {
      try {
        return JSON.parse(request.responseText);
      } catch (error) {
        return { error };
      }
    }
    return null;
  }
}

export default new Service();
