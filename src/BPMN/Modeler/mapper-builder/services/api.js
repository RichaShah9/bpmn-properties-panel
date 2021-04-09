import services from "../../../../services/Service";
import { sortBy } from "../utils";
import { ModelType, excludedUITypes } from "../constant";

export async function getModels(data = {}, metaModalType) {
  const models =
    ((!metaModalType || metaModalType === "metaModel") &&
      (await getMetaModels(data))) ||
    [];
  const metaJsonModels =
    ((!metaModalType || metaModalType === "metaJsonModel") &&
      (await getCustomModels(data))) ||
    [];
  const allModels = [];

  for (let i = 0; i < models.length; i++) {
    allModels.push({
      ...models[i],
      type: "metaModel",
    });
  }
  for (let i = 0; i < metaJsonModels.length; i++) {
    allModels.push({
      ...metaJsonModels[i],
      type: "metaJsonModel",
    });
  }
  return allModels || [];
}

export async function fetchModelByName(modelName) {
  let record = null;
  const res = await services.search("com.axelor.meta.db.MetaModel", {
    data: {
      criteria: [{ fieldName: "name", operator: "=", value: modelName }],
    },
    fields: ["name", "metaFields", "id", "fullName"],
  });
  if (res && res.status !== -1) {
    const { data = [] } = res || {};
    record = data[0] || null;
  }
  if (!record) {
    // find in custom model
    const criteria = [{ fieldName: "name", operator: "=", value: modelName }];
    const customModelData = await getCustomModels(criteria);
    record = customModelData[0];
  }
  return record || null;
}

export async function getMetaModels(e) {
  const criteria = [];
  if (e && e.search) {
    criteria.push({ fieldName: "fullName", operator: "like", value: e.search });
  }
  const res = await services.search("com.axelor.meta.db.MetaModel", {
    data: {
      criteria,
    },
    fields: ["name", "metaFields", "id", "fullName"],
  });
  const customModelCriteria = [];
  if (e && e.search) {
    customModelCriteria.push({
      fieldName: "name",
      operator: "like",
      value: e.search,
    });
  }
  const customModelData = await getCustomModels(customModelCriteria);
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return [...data, ...customModelData];
}

export async function getCustomModels(criteria = {}) {
  const res = await services.search("com.axelor.meta.db.MetaJsonModel", {
    data: {
      criteria,
    },
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data.map((d) => {
    return { ...d, modelType: ModelType.CUSTOM };
  });
}

export async function fetchMetaFields(criteria = {}) {
  const res = await services.search("com.axelor.meta.db.MetaField", {
    data: criteria,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}

export async function fetchModelFields(item, isSubField = false) {
  let entity = `${item.packageName}.${item.typeName}`;
  if (isSubField) {
    entity = item.target;
  }
  const fields = await fetchFields({ fullName: entity });
  return fields;
}

export async function fetchFields(item, excludeUIFields = false) {
  let fields = [];
  const entity = `${item.fullName}`;
  if (item.modelType === ModelType.CUSTOM || !item.fullName) {
    const criteria = [
      { fieldName: "jsonModel.name", operator: "=", value: item.name },
    ];
    const searchData = {
      criteria,
    };
    const res = await services.search("com.axelor.meta.db.MetaJsonField", {
      data: searchData,
      fields: [
        "type",
        "nameField",
        "required",
        "model",
        "targetModel",
        "targetJsonModel",
        "targetJsonModel.name",
        "modelField",
        "jsonModel",
        "title",
        "name",
      ],
    });
    const { data = [] } = res || {};
    fields = [...data];
  } else {
    const res = await services.fetchFields(entity);
    if (res && res.status === -1) return [];
    const { data = [] } = res || {};
    fields = [...data.fields];
    Object.keys(data.jsonFields).forEach((fieldKey) => {
      const jsonField = data.jsonFields[fieldKey];
      fields.push(...Object.values(jsonField));
    });
  }
  const newFields = sortBy(fields, "name");
  return newFields.filter((field) => !excludedUITypes.includes(field.type));
}

export async function fetchCustomFields(item) {
  if (item.targetModel) {
    const fields = await fetchFields({ fullName: item.targetModel });
    return fields;
  } else if (item.targetJsonModel) {
    const criteria = [
      {
        fieldName: "jsonModel.id",
        operator: "=",
        value: item.targetJsonModel.id,
      },
    ];
    const searchData = {
      criteria,
    };
    const res = await services.search("com.axelor.meta.db.MetaJsonField", {
      data: searchData,
      fields: [
        "type",
        "nameField",
        "required",
        "model",
        "targetModel",
        "targetJsonModel",
        "targetJsonModel.name",
        "modelField",
        "jsonModel",
        "title",
        "name",
      ],
      sortBy: ["name"],
    });
    const { data = [] } = res || {};
    return [...data];
  }
  return [];
}

export async function saveRecord(params, record) {
  const res = await services.add(params.model, record);
  if (res && res.status === -1) return null;
  const { data = [] } = res || {};
  return data[0] || null;
}

export async function fetchRecord(model, id) {
  const res = await services.fetchRecord(model, id);
  if (res && res.status === -1) return null;
  const { data = [] } = res || {};
  return data[0] || null;
}

export async function getCustomModelData(jsonModel) {
  const res = await services.search("com.axelor.meta.db.MetaJsonRecord", {
    data: {
      criteria: [{ fieldName: "jsonModel", operator: "=", value: jsonModel }],
      // _domain: 'self.jsonModel.id=2',
      operator: "and",
    },
  });
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function getCustomModelByDomain(jsonModelDomain) {
  const res = await services.search("com.axelor.meta.db.MetaJsonRecord", {
    data: {
      _domain: jsonModelDomain,
    },
  });
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function getNameField(jsonModel) {
  const res = await services.search("com.axelor.meta.db.MetaJsonField", {
    data: {
      criteria: [
        { fieldName: "jsonModel", operator: "=", value: jsonModel },
        { fieldName: "nameField", operator: "=", value: true },
      ],
      operator: "and",
    },
    fields: ["name"],
  });
  if (res && res.status > -1) {
    return res.data && res.data[0];
  }
}

export async function getNameFieldByDomain(jsonModelName) {
  const res = await services.search("com.axelor.meta.db.MetaJsonField", {
    data: {
      _domain: `self.jsonModel.name = '${jsonModelName}' and self.nameField = true`,
    },
    fields: ["name"],
  });
  if (res && res.status > -1) {
    return res.data && res.data[0];
  }
}

export async function getData(model) {
  const res = await services.search(model);
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function generateScriptString(jsonString, model) {
  const action = "action-mapper-method-create-script-from-json";
  const data = {
    action,
    data: {
      context: {
        _model: model,
        _jsonString: jsonString,
      },
    },
  };
  const { data: responseData = [] } = await services.action(data);
  if (
    Array.isArray(responseData) &&
    responseData[0] &&
    responseData[0].values &&
    responseData[0].values._scriptString
  ) {
    return responseData[0].values._scriptString;
  }
  return undefined;
}
