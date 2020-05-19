import Service from "./Service";

export function getMetaModels() {
  const res = Service.sync(
    "/ws/rest/com.axelor.meta.db.MetaModel/search",
    "post",
    {
      fields: ["id", "fullName"],
      data: {
        criteria: [
          { fieldName: "packageName", operator: "like", value: "meta" },
        ],
      },
    }
  );
  const { data = [] } = res || {};
  if (Array.isArray(data)) {
    return data.map(({ id, fullName }) => ({ name: fullName, value: id }));
  }
  return [];
}
