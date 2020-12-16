import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Paper } from "@material-ui/core";
import produce from "immer";
import Editor from "./editor";
import { Selection } from "./component";
import { getMetaFields } from "./services/api";
import { getModels } from "../../../services/api";

const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
  },
  rulesGroupHeader: {
    display: "flex",
  },
  paper: {
    margin: theme.spacing(1),
    padding: theme.spacing(3, 2),
  },
  rules: {
    display: "flex",
  },
  MuiAutocompleteRoot: {
    width: "100%",
    marginRight: "10px",
  },
  MuiAutocompleteRoot1: {
    width: "500px",
  },
  title: {
    flexGrow: 1,
  },
  disabled: {
    pointerEvents: "none",
    opacity: 0.5,
  },
  popoverContainer: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
  },
  typography: {
    display: "flex",
  },
  popoverHeader: {
    display: "flex",
    alignItems: "center",
    borderBottom: "solid 1px #DDD",
  },
}));

let id = 0;

const defaultRules = {
  id,
  parentId: -1,
  combinator: "and",
  rules: [{}],
};

const defaultState = {
  rules: [defaultRules],
};

function ExpressionBuilder(props) {
  const {
    value = defaultState,
    setValue,
    index,
    element,
    parentCombinator,
  } = props;
  const { metaModals: model, rules: r } = value;
  const [expression] = React.useState("GROOVY");
  const [metaModals, setMetaModals] = React.useState(model);
  const [rules, setRules] = React.useState(r);
  const classes = useStyles();

  React.useEffect(() => {
    setValue({ metaModals, rules }, index);
  }, [index, setValue, metaModals, rules]);

  const fields =
    metaModals &&
    metaModals.metaFields &&
    metaModals.metaFields.map((f) => f.name);

  function onAddGroup(parentId) {
    id = id + 1;
    setRules((state) => [...state, { id, parentId, rules: [] }]);
  }

  function onRemoveGroup(id) {
    setRules(
      produce((draft) => {
        const index = rules.findIndex((r) => r.id === id);
        draft.splice(index, 1);
      })
    );
  }

  function onAddRule(editorId, rule = {}) {
    setRules(
      produce((draft) => {
        const editorIndex = rules.findIndex((i) => i.id === editorId);
        draft[editorIndex].rules = [...draft[editorIndex].rules, rule];
      })
    );
  }

  function onRemoveRule(editorId, index) {
    setRules(
      produce((draft) => {
        const editorIndex = rules.findIndex((i) => i.id === editorId);
        draft[editorIndex].rules.splice(index, 1);
      })
    );
  }

  const getChildEditors = (parentId) => {
    return rules.filter((editor) => editor.parentId === parentId);
  };

  function onChange({ name, value }, editor, index) {
    setRules(
      produce((draft) => {
        const editorIndex = rules.findIndex((i) => i.id === editor.id);
        if (index >= 0) {
          Object.assign(
            (draft[editorIndex].rules[index] = {
              ...draft[editorIndex].rules[index],
              [name]: value,
              ...(name === "fieldName"
                ? { operator: "", fieldValue: "", fieldValue2: "" }
                : {}),
              ...(name === "operator"
                ? { fieldValue: "", fieldValue2: "" }
                : {}),
            })
          );
        } else {
          draft[editorIndex][name] = value;
        }
      })
    );
  }

  async function fetchField() {
    const allFields = (await getMetaFields(fields, metaModals)) || [];
    return allFields.filter(
      (a) => !["button", "separator", "panel"].includes(a.type)
    );
  }

  function getProcessConfig(type) {
    let bo =
      element && element.businessObject && element.businessObject.$parent;
    if (element && element.type === "bpmn:Process") {
      bo = element.businessObject;
    }
    if (
      (element && element.businessObject && element.businessObject.$type) ===
      "bpmn:Participant"
    ) {
      bo =
        element && element.businessObject && element.businessObject.processRef;
    }
    const noOptions = {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: [],
        },
      ],
    };
    const extensionElements = bo && bo.extensionElements;
    if (!extensionElements || !extensionElements.values) return noOptions;
    const processConfigurations = extensionElements.values.find(
      (e) => e.$type === "camunda:ProcessConfiguration"
    );
    const metaModels = [],
      metaJsonModels = [];
    if (
      !processConfigurations &&
      !processConfigurations.processConfigurationParameters
    )
      return noOptions;
    processConfigurations.processConfigurationParameters.forEach((config) => {
      if (config.metaModel) {
        metaModels.push(config.metaModel);
      } else if (config.metaJsonModel) {
        metaJsonModels.push(config.metaJsonModel);
      }
    });

    let value = [];
    if (type === "metaModel") {
      value = [...metaModels];
    } else if (type === "metaJsonModel") {
      value = [...metaJsonModels];
    } else {
      value = [...metaModels, ...metaJsonModels];
    }
    const data = {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: value,
        },
      ],
      operator: "or",
    };
    return data;
  }

  return (
    <div style={{ width: "100%" }}>
      <Paper variant="outlined" className={classes.paper}>
        <div
          style={{ display: "flex", width: "100%", flexDirection: "column" }}
        >
          <div style={{ display: "flex" }}>
            <Selection
              name="metaModal"
              title="Meta Modal"
              placeholder="meta modal"
              fetchAPI={() => getModels(getProcessConfig())}
              optionLabelKey="name"
              onChange={(e) => {
                setMetaModals(e);
                setRules([defaultRules]);
              }}
              value={metaModals}
              classes={{ root: classes.MuiAutocompleteRoot }}
            />
          </div>
        </div>

        {rules
          .filter((e) => e.parentId === -1)
          .map((editor) => {
            return (
              <React.Fragment key={editor.id}>
                <Editor
                  onAddGroup={onAddGroup}
                  onRemoveGroup={onRemoveGroup}
                  onAddRule={onAddRule}
                  onRemoveRule={onRemoveRule}
                  getChildEditors={getChildEditors}
                  getMetaFields={fetchField}
                  onChange={(e, editor, index) => onChange(e, editor, index)}
                  editor={editor}
                  isDisable={!Boolean(metaModals)}
                  expression={expression}
                  parentCombinator={parentCombinator}
                />
                <br />
              </React.Fragment>
            );
          })}
      </Paper>
    </div>
  );
}

export default ExpressionBuilder;
