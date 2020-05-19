import entryFactory from "bpmn-js-properties-panel/lib/factory/EntryFactory";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import participantHelper from "bpmn-js-properties-panel/lib/helper/ParticipantHelper";
import nameEntryFactory from "bpmn-js-properties-panel/lib/provider/bpmn/parts/implementation/Name";
import utils from "bpmn-js-properties-panel/lib/Utils";
import CmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import { getMetaModels } from "../services/api";

export function processProps(group, element, translate, options) {
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
      let idEntry = entryFactory.validationAwareTextField({
        id: "process-id",
        label: translate("Process Id"),
        description: processIdDescription && translate(processIdDescription),
        modelProperty: "processId",
      });

      // in participants we have to change the default behavior of set and get
      idEntry.get = function (element) {
        let properties = participantHelper.getProcessBusinessObject(
          element,
          "id"
        );
        return { processId: properties.id };
      };

      idEntry.set = function (element, values) {
        return participantHelper.modifyProcessBusinessObject(element, "id", {
          id: values.processId,
        });
      };

      idEntry.validate = function (element, values) {
        let idValue = values.processId;

        let bo = getBusinessObject(element);

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
        return participantHelper.modifyProcessBusinessObject(
          element,
          "name",
          values
        );
      };
      group.entries.push(processNameEntry);
    }

    let metaModel = entryFactory.selectBox({
      id: "metaModel",
      label: "Meta Model",
      selectOptions: function() {
        return getMetaModels();
      },
      setControlValue: true,
      modelProperty: "metaModel",

      get: function (element, node) {
        let bo = getBusinessObject(element);
        return { metaModel: bo.get("camunda:topic") };
      },

      set: function (element, values, node) {
        let bo = getBusinessObject(element);
        return CmdHelper.updateBusinessObject(element, bo, {
          "camunda:topic": values.metaModel,
        });
      },
    });
    group.entries.push(metaModel);
  }
}
