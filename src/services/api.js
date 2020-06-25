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
    if (Array.isArray(data)) {
      return [
        { name: "", value: "" },
        ...(data.map(({ id, model }) => ({ name: model, value: model })) || []),
      ];
    }
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
  if (Array.isArray(data)) {
    return [
      { name: "", value: "" },
      ...(data.map(({ name, id }) => ({ name: name, value: name, id: id })) ||
        []),
    ];
  }
  return [];
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
  const { fields = [] } = data;
  if (Array.isArray(fields)) {
    return [
      { name: "", value: "" },
      ...(fields.map(({ name, title }) => ({ name: title, value: name })) ||
        []),
    ];
  }
  return [];
}
