import Service from "./Service";
import * as _ from "lodash";

export async function getModels(id, criteria) {
  const res = await Service.fetchId("com.axelor.apps.bpm.db.WkfModel", id, {
    fields: ["wkfProcessList"],
    related: {
      wkfProcessList: ["name", "processId", "wkfProcessConfigList"],
    },
  });
  const { data = [] } = res || {};
  const { wkfProcessList } = data[0] || {};
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
    const { data = [] } = resList || [];
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
  if (!model || !model.model) return [];
  let res;
  if (formName) {
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
      model: model.model,
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
            _domain: `self.metaModel.fullName = '${model.model}'`,
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

