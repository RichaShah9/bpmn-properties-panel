import Service from "./Service";

export async function getModels(id, criteria) {
  const res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id, {
    fields: ["wkfProcessList"],
    related: {
      wkfProcessList: ["name", "processId", "wkfProcessConfigList"],
    },
  });
  const { data = [] } = res || {};
  const { wkfProcessList } = data[0];
  let configIds = [];
  wkfProcessList.forEach((list) => {
    const { wkfProcessConfigList } = list;
    const ids = wkfProcessConfigList.map((list) => list.id);
    configIds = [...configIds, ...ids];
  });
  let ids = Array.from(new Set([...configIds]));
  if (ids.length > 0) {
    const resList = await Service.search(
      "com.axelor.apps.bpm.db.WkfProcessConfig",
      {
        fields: ["model"],
        data: {
          criteria: [{ fieldName: "id", operator: "IN", value: ids }],
          ...criteria,
        },
      }
    );
    const { data } = resList || [];
    let models = data.filter((val) => val.model !== null);
    return models;
  }
  return [];
}

export async function getViews(model, criteria) {
  if (!model) return [];
  const res = await Service.search(`com.axelor.meta.db.MetaView`, {
    fields: ["name", "title"],
    data: {
      criteria: [
        {
          fieldName: "model",
          operator: "=",
          value: model,
        },
        {
          fieldName: "type",
          operator: "=",
          value: "form",
        },
        ...criteria,
      ],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  let views = data.filter((val) => val.name !== null);
  return views;
}

export async function getItems(formName, model, criteria) {
  if (!formName) return [];
  const res = await Service.post(`/ws/meta/view`, {
    data: {
      context: {
        "json-enhance": "true",
        _id: null,
      },
      name: formName,
      type: "form",
      criteria,
    },
    model: model,
  });
  const { data = [] } = res || {};
  const { fields = [], view } = data;
  const panels = view.items.filter((item) => item.title !== null);
  let items = fields.filter((val) => val.title !== null);
  return [...items, ...panels];
}

export async function getRoles(criteria) {
  const res = await Service.search(`com.axelor.auth.db.Role`, {
    fields: ["name"],
    data: {
      criteria: [...criteria],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  return data;
}
