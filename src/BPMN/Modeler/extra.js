import propertiesTabs from "./properties/properties";
import { download, getBool, translate } from "../../utils";
import { tabProperty } from "./properties/tabProperty";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import Service from "../../services/Service";

export const getProcessBusinessObject = (element, propertyName) => {
  if (!is(element, "bpmn:Participant")) {
    return {};
  }
  let bo = getBusinessObject(element).get("processRef"),
    properties = {};
  properties[propertyName] = bo && bo.get(propertyName);
  return properties;
};

export const fetchId = () => {
  const regexBPMN = /[?&]id=([^&#]*)/g; // ?id=1
  const regexTimeEvent = /[?&]timerTask=([^&#]*)/g; // ?id=1&timerTask=false
  const url = window.location.href;
  let matchBPMNId,
    id,
    matchTimeEvent,
    timerTask = true;
  while ((matchBPMNId = regexBPMN.exec(url))) {
    id = matchBPMNId[1];
  }

  while ((matchTimeEvent = regexTimeEvent.exec(url))) {
    timerTask = getBool(matchTimeEvent[1]);
  }
  return { id, timerTask };
};

export const uploadXml = () => {
  document.getElementById("inputFile").click();
};

export const getType = (element) => {
  if (!element) return;
  const type = (element.type || element.$type).toLowerCase();
  return type.includes("event")
    ? "event"
    : type.includes("task")
    ? "task"
    : type.includes("gateway")
    ? "gateway"
    : type;
};

export const addOldNodes = async (wkf, setWkf, bpmnModeler) => {
  const elements = getElements(bpmnModeler);
  let res = await Service.add("com.axelor.apps.bpm.db.WkfModel", {
    ...wkf,
    oldNodes: JSON.stringify(elements),
  });
  if (res && res.data && res.data[0]) {
    setWkf({ ...res.data[0] });
  }
};

export const getElements = (bpmnModeler) => {
  const rootElements =
    bpmnModeler._definitions && bpmnModeler._definitions.rootElements;
  const processes =
    rootElements && rootElements.filter((ele) => ele.$type === "bpmn:Process");
  const allProcess = {};
  processes &&
    processes.forEach((process) => {
      let elements = [];
      process.flowElements &&
        process.flowElements.forEach((element) => {
          if (
            ["event", "task", "gateway", "bpmn:callactivity"].includes(
              getType(element)
            )
          ) {
            elements.push({
              id: element.id,
              name: element.name || element.id,
              type: getType(element),
            });
          }
        });
      allProcess[process.id] = {
        elements: elements,
      };
    });
  return allProcess;
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

export function isGroupVisible(group, element, groupNode) {
  if (typeof group.enabled === "function") {
    return group.enabled(element, groupNode);
  } else {
    return true;
  }
}

export function isHiddenProperty(element, entry, node) {
  if (typeof entry.hidden === "function") {
    return entry.hidden(element, node);
  } else if (typeof entry.showLink === "function") {
    return !entry.showLink(element, node);
  } else {
    return false;
  }
}

export function isTabVisible(tab, element) {
  if (typeof tab.enabled === "function") {
    return tab.enabled(element);
  } else {
    return true;
  }
}

export function renderTabs(tabs = [], element) {
  const type = element.$type || element.type;
  const subType =
    element.businessObject &&
    element.businessObject.eventDefinitions &&
    element.businessObject.eventDefinitions[0].$type;
  const bo =
    tabProperty.find((tab) => tab.type === type && tab.subType === subType) ||
    {};

  const objectTabs = bo.tabs;
  let filteredTabs = [];
  tabs &&
    tabs.forEach((tab) => {
      if (!tab) return;
      if (objectTabs && objectTabs.includes(tab.id)) {
        const isEnable = isTabVisible(tab, element);
        if (isEnable) {
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
    translate,
    bpmnModeler
  );
  let filteredTabs = renderTabs(tabs, element);
  return filteredTabs;
}

export function hidePanelElements() {
  const dataObject = document.querySelector(
    '[title="Create DataObjectReference"]'
  );
  const dataStore = document.querySelector(
    '[title="Create DataStoreReference"]'
  );
  if (dataObject && dataObject.style) {
    dataObject.style.display = "none";
  }
  if (dataStore && dataStore.style) {
    dataStore.style.display = "none";
  }
}

export default {
  fetchId,
  uploadXml,
  getElements,
  renderTabs,
  getTabs,
  isGroupVisible,
  isTabVisible,
  hidePanelElements,
  addOldNodes,
  getProcessBusinessObject,
};
