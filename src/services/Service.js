export class Service {
  constructor() {
    const headers = new Headers();
    headers.append("Accept", "application/json");
    headers.append("Content-Type", "application/json");
    headers.append("X-Requested-With", "XMLHttpRequest");
    this.baseURL =
      process.env.NODE_ENV === "production" ? ".." : "axelor-erp";
    this.headers = headers;
  }

  fetch(url, method, options) {
    return fetch(url, options)
      .then(data => {
        if (["head", "delete"].indexOf(method.toLowerCase()) !== -1)
          return data;
        let isJSON = data.headers
          .get("content-type")
          .includes("application/json");
        return isJSON ? data.json() : data;
      })
      .catch(err => {});
  }

  request(url, config = {}, data = {}) {
    const options = Object.assign(
      {
        method: "POST",
        credentials: "include",
        headers: this.headers,
        mode: "cors",
        body: JSON.stringify(data)
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
      method: "POST"
    };
    return this.request(url, config, data);
  }

  fetchId(entity, id, data = {}) {
    const url = `ws/rest/${entity}/${id}/fetch`;
    return this.post(url, data);
  }
}

export default new Service();
