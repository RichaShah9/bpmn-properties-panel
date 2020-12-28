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
    .search({ data, fields, limit: 10 })
    .then(({ data = [] }) => data);
}

export async function getMetaFields(fields, model) {
  if (!model) return [];
  if (model.type === "metaModel") {
    let res = await metaFieldService.fields({ fields, model: model.fullName });
    return res && res.data && res.data.fields;
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

export async function getSubMetaField(model) {
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
  return res && res.data && res.data.fields;
}

export async function getData(model) {
  const modelService = new AxelorService({ model });
  const res = await modelService.search({ limit: 10 });
  return res && res.data;
}
