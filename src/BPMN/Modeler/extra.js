import propertiesTabs from "./properties/properties";
import { download, translate } from "../../utils";

export const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchBPMNId, id;
  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
    return id;
  }
};

export const uploadXml = () => {
  document.getElementById("inputFile").click();
};

export const getType = (element) => {
  if (!element) return;
  const type = element.type.toLowerCase();
  return type.includes("event")
    ? "event"
    : type.includes("task")
    ? "task"
    : type;
};

export const getElements = (bpmnModeler) => {
  let elementRegistry = bpmnModeler.get("elementRegistry");
  let elements = [],
    elementIds = [];
  elementRegistry.filter(function (element) {
    if (["event", "task"].includes(getType(element))) {
      elements.push({
        id: element.id,
        name: element.businessObject.name || element.id,
        type: getType(element),
      });
      elementIds.push(element.id);
    }
    return element;
  });
  return { elementIds, elements };
};

export const saveSVG = (bpmnModeler) => {
  bpmnModeler.saveSVG({ format: true }, async function (err, svg) {
    download(svg, "diagram.svg");
  });
};

export const downloadXml = (bpmnModeler) => {
  bpmnModeler.saveXML({ format: true }, async function (err, xml) {
    download(xml, "diagram.bpmn");
  });
};

export function renderTabs(tabs = [], element) {
  let filteredTabs = [];
  tabs &&
    tabs.forEach((tab) => {
      if (!tab) return;
      let areEntries =
        tab.groups && tab.groups.filter((g) => g.entries.length > 0);
      if (areEntries && areEntries.length > 0) {
        if (tab.enabled) {
          const isEnable = tab.enabled(element);
          if (isEnable) {
            filteredTabs.push(tab);
          }
        } else {
          filteredTabs.push(tab);
        }
      }
    });
  return filteredTabs;
}

export function getTabs(bpmnModeler, element) {
  let canvas = bpmnModeler.get("canvas");
  let elementRegistry = bpmnModeler.get("elementRegistry");
  let bpmnFactory = bpmnModeler.get("bpmnFactory");
  let elementTemplates = bpmnModeler.get("elementTemplates");
  let tabs = propertiesTabs(
    element,
    canvas,
    bpmnFactory,
    elementRegistry,
    elementTemplates,
    translate
  );
  let filteredTabs = renderTabs(tabs, element);
  return filteredTabs;
}

export default {
  fetchId,
  uploadXml,
  getElements,
  renderTabs,
  getTabs,
};
