import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

export default function CandidateStarter(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject;

  let candidateStarterGroupsEntry = {
    id: "candidateStarterGroups",
    label: translate("Candidate Starter Groups"),
    modelProperty: "candidateStarterGroups",
    description: translate(
      "Specify more than one group as a comma separated list."
    ),
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let candidateStarterGroups = bo.get("camunda:candidateStarterGroups");

      return {
        candidateStarterGroups: candidateStarterGroups
          ? candidateStarterGroups
          : "",
      };
    },

    set: function (element, values) {
      let bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        "camunda:candidateStarterGroups":
          values.candidateStarterGroups || undefined,
      });
    },
  };

  let candidateStarterUsersEntry = {
    id: "candidateStarterUsers",
    label: translate("Candidate Starter Users"),
    modelProperty: "candidateStarterUsers",
    description: translate(
      "Specify more than one user as a comma separated list."
    ),
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let candidateStarterUsers = bo.get("camunda:candidateStarterUsers");

      return {
        candidateStarterUsers: candidateStarterUsers
          ? candidateStarterUsers
          : "",
      };
    },

    set: function (element, values) {
      let bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        "camunda:candidateStarterUsers":
          values.candidateStarterUsers || undefined,
      });
    },
  };

  return [candidateStarterGroupsEntry, candidateStarterUsersEntry];
}
