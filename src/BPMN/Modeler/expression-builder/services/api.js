import AxelorService from "./axelor.rest";
import services from "../../../../services/Service";

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
    let res = await metaFieldService.fields({ fields, model: model.fullName });
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
    let res = await services.search("com.axelor.meta.db.MetaJsonField", {
      data: {
        _domain: `self.jsonModel.name = '${model.name}'`,
        _domainContext: {
          _model: "com.axelor.meta.db.MetaJsonField",
        },
      },
      fields: ["name", "model", "type", "title"],
    });
    return res && res.data;
  }
}

export async function getMetaModal(data) {
  const res = await metaModalService.search({ data });
  return res && res.data && res.data[0];
}

export async function getSubMetaField(model, isM2MFields = true) {
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
      )
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
