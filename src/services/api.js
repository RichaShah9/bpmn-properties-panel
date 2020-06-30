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
        data: {
          criteria: [{ fieldName: "id", operator: "IN", value: ids }],
          ...criteria,
        },
        fields: ["metaJsonModel.name", "metaJsonModel", "metaModel", "model"],
      }
    );
    const { data } = resList || [];
    const models = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].metaModel) {
        models.push({
          ...data[i].metaModel,
          model: data[i].model,
          type: "metaModel",
        });
      }
      if (data[i].metaJsonModel) {
        models.push({
          ...data[i].metaJsonModel,
          name: data[i]["metaJsonModel.name"],
          model: data[i].model,
          type: "metaJsonModel",
        });
      }
    }

    return models;
  }
  return [];
}

export async function getViews(model, criteria) {
  if (!model) return [];
  let options = [
    {
      fieldName: "type",
      operator: "=",
      value: "form",
    },
  ];

  if (model.type === "metaJsonModel") {
    options.push({
      fieldName: "name",
      operator: "=",
      value: `custom-model-${model.name}-form`,
    });
  } else {
    options.push({
      fieldName: "model",
      operator: "=",
      value: model.model,
    });
  }

  const res = await Service.search(`com.axelor.meta.db.MetaView`, {
    fields: ["name", "title"],
    data: {
      criteria: [...options, ...criteria],
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
