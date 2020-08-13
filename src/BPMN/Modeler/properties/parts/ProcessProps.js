import participantHelper from "bpmn-js-properties-panel/lib/helper/ParticipantHelper";
import nameEntryFactory from "./implementation/Name";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

export default function ProcessProps(group, element, translate, options) {
  let businessObject = getBusinessObject(element);

  let processIdDescription = options && options.processIdDescription;

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    /**
     * processId
     */
    if (is(element, "bpmn:Participant")) {
      let idEntry = {
        id: "process-id",
        label: translate("Process Id"),
        description: processIdDescription && translate(processIdDescription),
        modelProperty: "processId",
        widget: "textField", //validationAwareTextField
      };

      // in participants we have to change the default behavior of set and get
      idEntry.get = function (element) {
        let properties = participantHelper.getProcessBusinessObject(
          element,
          "id"
        );
        return { processId: properties.id };
      };

      idEntry.set = function (element, values) {
        if (
          element &&
          element.businessObject &&
          element.businessObject.processRef
        ) {
          element.businessObject.processRef.id = values.processId;
        }
      };

      idEntry.validate = function (element, values) {
        let idValue = values.processId;
        let bo = getBusinessObject(element);
        if (!bo.processRef) return;
        let processIdError = utils.isIdValid(bo.processRef, idValue, translate);
        return processIdError ? { processId: processIdError } : {};
      };

      group.entries.push(idEntry);

      /**
       * process name
       */
      let processNameEntry = nameEntryFactory(element, {
        id: "process-name",
        label: translate("Process Name"),
      })[0];

      // in participants we have to change the default behavior of set and get
      processNameEntry.get = function (element) {
        return participantHelper.getProcessBusinessObject(element, "name");
      };

      processNameEntry.set = function (element, values) {
        if (
          element &&
          element.businessObject &&
          element.businessObject.processRef
        ) {
          element.businessObject.processRef.name = values.name;
        }
      };

      group.entries.push(processNameEntry);
    }
  }
}
