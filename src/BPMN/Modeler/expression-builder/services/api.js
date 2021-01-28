import AxelorService from "./axelor.rest";
import services from "../../../../services/Service";
import { sortBy } from "../../../../utils";

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

export async function getMetaFields(fields, model) {
  if (!model) return [];
  if (model.type === "metaModel") {
    let res = await metaFieldService.fields({
      fields,
      model: model.fullName,
    });
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
    let fieldsRes = res && res.data && res.data.fields;
    if (
      zonedDateTimeFields &&
      zonedDateTimeFields.length > 0 &&
      fieldsRes &&
      fieldsRes.length > 0
    ) {
      fieldsRes.forEach((field) => {
        if (zonedDateTimeFields.includes(field.name)) {
          field.typeName = "ZonedDateTime";
        }
      });
      return fieldsRes;
    }
    return fieldsRes;
  } else {
    const res = await services.get(
      `ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=${model.name}`
    );
    const responseData = res && res.data;
    const allFields = responseData && responseData.fields;
    const jsonFields = Object.values(
      (responseData && responseData.jsonFields) || [{}]
    );
    let result = [];
    result = allFields.filter((f) => !f.json) || [];
    jsonFields &&
      jsonFields.forEach((jsonField) => {
        const nestedFields = Object.values(jsonField || {}) || [];
        const fields =
          nestedFields.filter(
            (a) =>
              ![
                "button",
                "separator",
                "panel",
                "one_to_many",
                "one-to-many",
                "binary",
              ].includes((a.type || "").toLowerCase())
          ) || [];
        result = [...result, ...fields];
      });
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
  isQuery = false
) {
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
      !["button", "separator", "panel", "one_to_many", "binary"].includes(
        (a.type || "").toLowerCase()
      ) && (isQuery ? !a.json : true)
  );
  if (!isM2MFields && resultFields && resultFields.length > 0) {
    return resultFields.filter((f) => f.type !== "MANY_TO_MANY");
  }
  return resultFields;
}

export async function getData(model) {
  const modelService = new AxelorService({ model });
  const res = await modelService.search({});
  return res && res.data;
}

export async function getCustomModelData(jsonModel) {
  const res = await services.search("com.axelor.meta.db.MetaJsonRecord", {
    _domain: `self.jsonModel = ${jsonModel}`,
    _domainContext: {
      jsonModel,
      _id: null,
      _model: "com.axelor.meta.db.MetaJsonRecord",
      fields: ["name", "attrs"],
    },
  });
  return res && res.data;
}
