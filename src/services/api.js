import Service from "./Service";
import * as _ from "lodash";

export async function getModels(data = {}) {
  const models = (await getMetaModels(data)) || [];
  const metaJsonModels = (await getCustomModels(data)) || [];
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

export async function getViews(model, criteria, type = "form") {
  if (!model || !model.name || !model.fullName) return [];
  let options = [
    {
      fieldName: "type",
      operator: "=",
      value: type,
    },
  ];

  if (model.type === "metaJsonModel") {
    options.push({
      fieldName: "name",
      operator: "=",
      value: `custom-model-${model.name}-${type}`,
    });
  } else {
    options.push({
      fieldName: "model",
      operator: "=",
      value: model.fullName,
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
  views = _.uniqBy(views || [], "name") || [];
  return views;
}

/**
 *
 * @param {String} formName
 * @param {Object} model
 * @param {Array} criteria
 *
 * If formName fetch form view
 * else only model is selected
 *  if model is metaModel
 *    fetch both real and custom fields
 * else
 *    fetch only custom fields
 */
export async function getItems(formName, model, criteria) {
  if (!model) return [];
  let res;
  if (formName && model.fullName) {
    res = await Service.post(`/ws/meta/view`, {
      data: {
        context: {
          "json-enhance": "true",
          _id: null,
        },
        name: formName,
        type: "form",
        criteria,
      },
      model: model.fullName,
    });
    const { data = [] } = res || {};
    const { fields = [], jsonAttrs = [], view } = data;
    const items = [...fields, ...jsonAttrs];
    const panels = [];
    view &&
      view.items &&
      view.items.forEach((item) => {
        panels.push(item);
        if (item) {
          const panelItems = item.items || [];
          panelItems &&
            panelItems.forEach((element) => {
              panels.push(element);
              const { jsonFields = [] } = element || {};
              if (jsonFields.length > 0) {
                jsonFields.forEach((field) => {
                  panels.push(field);
                });
              }
            });
        }
      });
    let allItems = [...items, ...panels];
    let uniqueItems = _.uniqBy(allItems, "name") || [];
    return [...uniqueItems, { name: "self", label: "Self" }];
  } else {
    let metaFields = [];
    if (model.type === "metaModel") {
      let metaFieldsRes =
        (await Service.search("com.axelor.meta.db.MetaField", {
          data: {
            _domain: `self.metaModel.fullName = '${model.fullName}'`,
            _domainContext: {
              _model: "com.axelor.meta.db.MetaModel",
            },
          },
        })) || {};
      metaFields = _.uniqBy(metaFieldsRes.data || [], "label") || [];
    }
    let metaJsonFields =
      (await Service.search("com.axelor.meta.db.MetaJsonField", {
        data: {
          _domain: `self.jsonModel.name = '${model.name}'`,
          _domainContext: {
            _model: "com.axelor.meta.db.MetaJsonField",
          },
        },
        fields: ["name", "model", "type", "title"],
      })) || {};
    let response = [...(metaFields || []), ...(metaJsonFields.data || [])];
    return response;
  }
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

export async function getTemplates(criteria) {
  const res = await Service.search("com.axelor.apps.message.db.Template", {
    data: criteria,
  });
  if (res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}

export async function getProcessConfigModel(data = {}) {
  const res = await Service.action({
    action: "action-wkf-process-config-attrs-set-model",
    data: {
      context: { ...data },
    },
    model: "com.axelor.apps.bpm.db.WkfProcessConfig",
  });
  if (
    res &&
    res.data &&
    res.data[0] &&
    res.data[0].attrs &&
    res.data[0].attrs.model
  ) {
    const model = res.data[0].attrs.model.value;
    return model;
  }
}
export async function getMetaModels(criteria = {}) {
  const res = await Service.search("com.axelor.meta.db.MetaModel", {
    data: criteria,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}

export async function getCustomModels(criteria = {}) {
  const res = await Service.search("com.axelor.meta.db.MetaJsonModel", {
    data: criteria,
  });
  if (res && res.status === -1) return [];
  const { data = [] } = res || {};
  return data;
}

export async function getAllModels(criteria = {}) {
  const models = (await getMetaModels(criteria)) || [];
  const metaJsonModels = (await getCustomModels(criteria)) || [];
  const data = [...models, ...metaJsonModels];
  return data;
}

export async function getParentMenus() {
  const res = await Service.search("com.axelor.meta.db.MetaMenu", {
    data: {
      _domain: `self.action is null`,
    },
  });
  const { data = [] } = res || {};
  if (data.status === -1) {
    return [];
  }
  return _.uniqBy(data || [], "name") || [];
}

export async function getSubMenus(parentMenu) {
  if (!parentMenu || !parentMenu.id) return;
  const res = await Service.search("com.axelor.meta.db.MetaMenu", {
    data: {
      criteria: [
        { fieldName: "parent.id", operator: "=", value: parentMenu.id },
      ],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  if (data.status === -1) {
    return [];
  }
  return _.uniqBy(data || [], "name") || [];
}

export async function getTranslations(key) {
  const res = await Service.search("com.axelor.meta.db.MetaTranslation", {
    data: {
      _domain: "self.key = :key",
      _domainContext: {
        key: `value:${key}`,
      },
    },
    sortBy: ["id"],
  });
  const { data = [] } = res || {};
  return data;
}

export async function removeAllTranslations(records) {
  const url = `ws/rest/com.axelor.meta.db.MetaTranslation/removeAll`;
  const res = await Service.post(url, {
    records,
  });
  const { status } = res || {};
  if (status === 0) return true;
  return false;
}

export async function addTranslations(records) {
  const url = `ws/rest/com.axelor.meta.db.MetaTranslation`;
  const res = await Service.post(url, {
    records,
  });
  const { data = [] } = res || {};
  return data;
}

export async function getDMNModel(decisionId) {
  if (!decisionId) return;
  const res = await Service.search("com.axelor.apps.bpm.db.WkfDmnModel", {
    data: {
      _domain: null,
      _domainContext: {
        _id: null,
        _model: "com.axelor.apps.bpm.db.WkfDmnModel",
      },
      operator: "and",
      criteria: [
        {
          fieldName: "dmnTableList.decisionId",
          operator: "=",
          value: decisionId,
        },
      ],
    },
  });
  const { data = [] } = res || {};
  const model = data[0];
  return model;
}

export async function getInfo() {
  const url = `ws/app/info`;
  const res = await Service.get(url);
  return res;
}

export async function getDMNModels(criteria = []) {
  const res = await Service.search("com.axelor.apps.bpm.db.DmnTable", {
    data: {
      criteria,
    },
  });
  const { data = [] } = res || {};
  return data;
}

export async function getBPMNModels(criteria = [], operator) {
  const res = await Service.search("com.axelor.apps.bpm.db.WkfProcess", {
    data: {
      criteria,
      operator
    },
  });
  const { data = [] } = res || {};
  return data;
}
