import AxelorService from "./axelor.rest";
import services from "../../../../services/Service";
import { sortBy } from "../../../../utils";
import { allowed_types } from "../data";

const metaModalService = new AxelorService({
  model: "com.axelor.meta.db.MetaModel",
});

const metaFieldService = new AxelorService({
  model: "com.axelor.meta.db.MetaField",
});

export async function getMetaModals({ search = "" }) {
  const data = {
    ...(search ? { name: search } : {}),
  };
  const fields = ["name", "fullName", "metaFields"];
  return metaModalService
    .search({ data, fields })
    .then(({ data = [] }) => data);
}

const getResultedFiels = (res, isQuery) => {
  const responseData = res && res.data;
  const allFields = responseData && responseData.fields;
  const jsonFields = Object.values(
    (responseData && responseData.jsonFields) || [{}]
  );
  let result = [];
  result =
    (allFields &&
      allFields.filter(
        (f) => !f.json && allowed_types.includes((f.type || "").toLowerCase())
      )) ||
    [];
  if (isQuery) return result;
  jsonFields &&
    jsonFields.forEach((jsonField) => {
      const nestedFields = Object.values(jsonField || {}) || [];
      const fields =
        nestedFields.filter(
          (a) =>
            allowed_types.includes((a.type || "").toLowerCase()) &&
            (a.type === "many-to-many" ? a.targetName : true)
        ) || [];
      result = [...result, ...fields];
    });
  return result;
};

export async function getMetaFields(model, isQuery) {
  if (!model) return [];
  if (model.type === "metaModel") {
    let res = await services.get(
      `ws/meta/fields/${
        model.fullName ? model.fullName : `${model.packageName}.${model.name}`
      }`
    );
    let result = getResultedFiels(res, isQuery);
    const zonedDateTimeFieldsRes = await services.search(
      "com.axelor.meta.db.MetaField",
      {
        data: {
          _domain: `self.metaModel.name = '${model.name}' AND self.typeName = 'ZonedDateTime'`,
          _domainContext: {
            _model: "com.axelor.meta.db.MetaField",
          },
        },
        fields: ["name", "typeName", "metaModel"],
      }
    );
    const zonedDateTimeFields =
      zonedDateTimeFieldsRes &&
      zonedDateTimeFieldsRes.data &&
      zonedDateTimeFieldsRes.data.length > 0 &&
      zonedDateTimeFieldsRes.data.map((f) => f.name);
    if (
      zonedDateTimeFields &&
      zonedDateTimeFields.length > 0 &&
      result &&
      result.length > 0
    ) {
      result.forEach((field) => {
        if (zonedDateTimeFields.includes(field.name)) {
          field.typeName = "ZonedDateTime";
        }
      });
      return result;
    }
    return result;
  } else {
    const res = await services.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${model.name}`
    );
    let result = getResultedFiels(res, isQuery);
    return sortBy(result, "sequence") || [];
  }
}

export async function getMetaModal(data) {
  const res = await metaModalService.search({ data });
  return res && res.data && res.data[0];
}

export async function getSubMetaField(
  model,
  isM2MFields = true,
  isQuery = false,
  relationJsonModel
) {
  if (model === "com.axelor.meta.db.MetaJsonRecord" && relationJsonModel) {
    const res = await services.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${relationJsonModel}`
    );
    let result = getResultedFiels(res, isQuery) || [];
    result = result.filter(
      (a) =>
        allowed_types.includes((a.type || "").toLowerCase()) &&
        (isQuery ? !a.json : true) &&
        (a.type === "many-to-many" ? a.targetName : true)
    );
    if (!isM2MFields && result && result.length > 0) {
      return result.filter((f) => f.type !== "MANY_TO_MANY");
    }
    return sortBy(result, "sequence") || [];
  } else {
    const data = {
      criteria: [{ fieldName: "fullName", operator: "=", value: model }],
    };
    const metaModel = await getMetaModal(data);
    if (!metaModel) return [];
    const fields = metaModel && metaModel.metaFields.map((f) => f.name);
    const res = await metaFieldService.fields({
      fields,
      model: metaModel.fullName,
    });
    let resultFields = res && res.data && res.data.fields;
    resultFields = resultFields.filter(
      (a) =>
        allowed_types.includes((a.type || "").toLowerCase()) &&
        (isQuery ? !a.json : true) &&
        (a.type === "many-to-many" ? a.targetName : true)
    );
    if (!isM2MFields && resultFields && resultFields.length > 0) {
      return resultFields.filter((f) => f.type !== "MANY_TO_MANY");
    }
    return resultFields;
  }
}

export async function getData(model) {
  const modelService = new AxelorService({ model });
  const res = await modelService.search({});
  if (res && res.status === -1) return [];
  return res && res.data;
}

export async function getCustomModelData(jsonModel) {
  const res = await services.search("com.axelor.meta.db.MetaJsonRecord", {
    data: {
      criteria: [{ fieldName: "jsonModel", operator: "=", value: jsonModel }],
      operator: "and",
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
