import Service from "./Service";
import * as _ from "lodash";

export async function getModels() {
  const models = (await getMetaModels()) || [];
  const metaJsonModels = (await getCustomModels()) || [];
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

export async function getMetaModels() {
  const res = await Service.search("com.axelor.meta.db.MetaModel");
  const { data = [] } = res || {};
  return data;
}

export async function getCustomModels() {
  const res = await Service.search("com.axelor.meta.db.MetaJsonModel");
  const { data = [] } = res || {};
  return data;
}

export async function getAllModels() {
  const models = (await getMetaModels()) || [];
  const metaJsonModels = (await getCustomModels()) || [];
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
  const res = await Service.search("com.axelor.meta.db.MetaMenu", {
    data: {
      criteria: [{ fieldName: "parent", operator: "=", value: parentMenu }],
      operator: "and",
    },
  });
  const { data = [] } = res || {};
  if (data.status === -1) {
    return [];
  }
  return _.uniqBy(data || [], "name") || [];
}

export async function getWkfModel(processId) {
  const res = await Service.search("com.axelor.apps.bpm.db.WkfModel", {
    data: {
      criteria: [
        {
          fieldName: "wkfProcessList.processId",
          operator: "=",
          value: processId,
        },
      ],
    },
  });
  const { data = [] } = res || {};
  const model = data[0];
  // if (!model) {
  //   let resModel = await Service.add("com.axelor.apps.bpm.db.WkfModel", {
  //     name: "Model",
  //   });
  //   const { data = [] } = resModel || {};
  //   const wkfModel = data[0] || {};
  //   return wkfModel;
  // }
  return model;
}
