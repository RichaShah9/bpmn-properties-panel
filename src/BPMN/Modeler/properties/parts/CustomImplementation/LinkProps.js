import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import TextField from "../../../../../components/properties/components/TextField";
import { translate } from "../../../../../utils";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
});

var linkEvents = ["bpmn:IntermediateThrowEvent", "bpmn:IntermediateCatchEvent"];

function getLinkEventDefinition(element) {
  var bo = getBusinessObject(element);

  var linkEventDefinition = null;
  if (bo.eventDefinitions) {
    bo.eventDefinitions.forEach((eventDefinition) => {
      if (is(eventDefinition, "bpmn:LinkEventDefinition")) {
        linkEventDefinition = eventDefinition;
      }
    });
  }
  return linkEventDefinition;
}

export default function LinkProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [linkEventDefinition, setLinkEventDefinition] = useState(null);

  const classes = useStyles();

  useEffect(() => {
    let isVaild = false;
    linkEvents.forEach((event) => {
      if (is(element, event)) {
        isVaild = true;
      }
    });
    const linkEventDefinition = getLinkEventDefinition(element);
    if (isVaild && linkEventDefinition) {
      setVisible(true);
      setLinkEventDefinition(linkEventDefinition);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <TextField
          element={element}
          entry={{
            id: "link-event",
            label: translate("Link Name"),
            modelProperty: "link-name",
            get: function () {
              return { "link-name": linkEventDefinition.get("name") };
            },

            set: function (element, values) {
              element.businessObject.eventDefinitions[0].name =
                values["link-name"];
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
