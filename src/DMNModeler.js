import React, { useState, useEffect } from "react";
import DmnJS from "dmn-js/lib/Modeler";
import { SaveIcon, UploadIcon, DownloadIcon } from "./assets";

import { download } from "./utils";
import Service from "./services/Service";
import "./App.css";

let dmnModeler = null;

const defaultDMNDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/" xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/" xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/" id="dish" name="Dish" namespace="http://camunda.org/schema/1.0/dmn">
  <inputData id="dayType_id" name="Type of day">
    <variable id="dayType_ii" name="Type of day" typeRef="string" />
  </inputData>
  <inputData id="temperature_id" name="Weather in Celsius">
    <variable id="temperature_ii" name="Weather in Celsius" typeRef="integer" />
  </inputData>
  <knowledgeSource id="host_ks" name="Host" />
  <knowledgeSource id="guest_ks" name="Guest Type">
    <authorityRequirement id="AuthorityRequirement_0kd7g1l">
      <requiredDecision href="#guestCount" />
    </authorityRequirement>
  </knowledgeSource>
  <businessKnowledgeModel id="elMenu" name="El menú" />
  <decision id="dish-decision" name="Dish Decision">
    <informationRequirement id="InformationRequirement_10q46rn">
      <requiredDecision href="#guestCount" />
    </informationRequirement>
    <informationRequirement id="InformationRequirement_0o1sd05">
      <requiredDecision href="#season" />
    </informationRequirement>
    <authorityRequirement id="AuthorityRequirement_01vpgc7">
      <requiredAuthority href="#host_ks" />
    </authorityRequirement>
    <decisionTable id="dishDecisionTable">
      <input id="seasonInput" label="Season">
        <inputExpression id="seasonInputExpression" typeRef="string">
          <text>season</text>
        </inputExpression>
      </input>
      <input id="guestCountInput" label="How many guests">
        <inputExpression id="guestCountInputExpression" typeRef="integer">
          <text>guestCount</text>
        </inputExpression>
      </input>
      <output id="output1" label="Dish" name="desiredDish" typeRef="string" />
      <rule id="row-495762709-1">
        <inputEntry id="UnaryTests_1nxcsjr">
          <text>"Winter"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_1r9yorj">
          <text>&lt;= 8</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1mtwzqz">
          <text>"Spareribs"</text>
        </outputEntry>
      </rule>
      <rule id="row-495762709-2">
        <inputEntry id="UnaryTests_1lxjbif">
          <text>"Winter"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_0nhiedb">
          <text>&gt; 8</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1h30r12">
          <text>"Pasta"</text>
        </outputEntry>
      </rule>
      <rule id="row-495762709-3">
        <inputEntry id="UnaryTests_0ifgmfm">
          <text>"Summer"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_12cib9m">
          <text>&gt; 10</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_0wgaegy">
          <text>"Light salad"</text>
        </outputEntry>
      </rule>
      <rule id="row-495762709-7">
        <inputEntry id="UnaryTests_0ozm9s7">
          <text>"Summer"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_0sesgov">
          <text>&lt;= 10</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1dvc5x3">
          <text>"Beans salad"</text>
        </outputEntry>
      </rule>
      <rule id="row-445981423-3">
        <inputEntry id="UnaryTests_1er0je1">
          <text>"Spring"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_1uzqner">
          <text>&lt; 10</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1pxy4g1">
          <text>"Stew"</text>
        </outputEntry>
      </rule>
      <rule id="row-445981423-4">
        <inputEntry id="UnaryTests_06or48g">
          <text>"Spring"</text>
        </inputEntry>
        <inputEntry id="UnaryTests_0wa71sy">
          <text>&gt;= 10</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_09ggol9">
          <text>"Steak"</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <decision id="season" name="Season decision">
    <informationRequirement id="InformationRequirement_03uqyun">
      <requiredInput href="#temperature_id" />
    </informationRequirement>
    <decisionTable id="seasonDecisionTable">
      <input id="temperatureInput" label="Weather in Celsius">
        <inputExpression id="temperatureInputExpression" typeRef="integer">
          <text>temperature</text>
        </inputExpression>
      </input>
      <output id="seasonOutput" label="season" name="season" typeRef="string" />
      <rule id="row-495762709-5">
        <inputEntry id="UnaryTests_1fd0eqo">
          <text>&gt;30</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_0l98klb">
          <text>"Summer"</text>
        </outputEntry>
      </rule>
      <rule id="row-495762709-6">
        <inputEntry id="UnaryTests_1nz6at2">
          <text>&lt;10</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_08moy1k">
          <text>"Winter"</text>
        </outputEntry>
      </rule>
      <rule id="row-445981423-2">
        <inputEntry id="UnaryTests_1a0imxy">
          <text>[10..30]</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1poftw4">
          <text>"Spring"</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <decision id="guestCount" name="Guest Count">
    <informationRequirement id="InformationRequirement_1138yrh">
      <requiredInput href="#dayType_id" />
    </informationRequirement>
    <knowledgeRequirement id="KnowledgeRequirement_1n7aj0o">
      <requiredKnowledge href="#elMenu" />
    </knowledgeRequirement>
    <decisionTable id="guestCountDecisionTable">
      <input id="typeOfDayInput" label="Type of day">
        <inputExpression id="typeOfDayInputExpression" typeRef="string">
          <text>dayType</text>
        </inputExpression>
      </input>
      <output id="guestCountOutput" label="Guest count" name="guestCount" typeRef="integer" />
      <rule id="row-495762709-8">
        <inputEntry id="UnaryTests_0l72u8n">
          <text>"Weekday"</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_0wuwqaz">
          <text>4</text>
        </outputEntry>
      </rule>
      <rule id="row-495762709-9">
        <inputEntry id="UnaryTests_03a73o9">
          <text>"Holiday"</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1whn119">
          <text>10</text>
        </outputEntry>
      </rule>
      <rule id="row-495762709-10">
        <inputEntry id="UnaryTests_12tygwt">
          <text>"Weekend"</text>
        </inputEntry>
        <outputEntry id="LiteralExpression_1b5k9t8">
          <text>15</text>
        </outputEntry>
      </rule>
    </decisionTable>
  </decision>
  <textAnnotation id="TextAnnotation_1">
    <text>Week day or week end</text>
  </textAnnotation>
  <association id="Association_18hoj4i">
    <sourceRef href="#dayType_id" />
    <targetRef href="#TextAnnotation_1" />
  </association>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="DMNDiagram_1v1lz0z">
      <dmndi:DMNShape id="DMNShape_07ujbdn" dmnElementRef="dayType_id">
        <dc:Bounds height="45" width="125" x="303" y="363" />
      </dmndi:DMNShape>
      <dmndi:DMNShape id="DMNShape_0wkt4yv" dmnElementRef="temperature_id">
        <dc:Bounds height="45" width="125" x="105" y="316" />
      </dmndi:DMNShape>
      <dmndi:DMNShape id="DMNShape_1isa6v2" dmnElementRef="host_ks">
        <dc:Bounds height="63" width="100" x="595" y="56" />
      </dmndi:DMNShape>
      <dmndi:DMNShape id="DMNShape_0vwo5po" dmnElementRef="guest_ks">
        <dc:Bounds height="63" width="100" x="587" y="194" />
      </dmndi:DMNShape>
      <dmndi:DMNEdge id="DMNEdge_1k3h3u8" dmnElementRef="AuthorityRequirement_0kd7g1l">
        <di:waypoint x="510" y="226" />
        <di:waypoint x="587" y="226" />
      </dmndi:DMNEdge>
      <dmndi:DMNShape id="DMNShape_1emgpoc" dmnElementRef="elMenu">
        <dc:Bounds height="46" width="135" x="542" y="364" />
      </dmndi:DMNShape>
      <dmndi:DMNShape id="DMNShape_0jhujfn" dmnElementRef="dish-decision">
        <dc:Bounds height="80" width="180" x="250" y="56" />
      </dmndi:DMNShape>
      <dmndi:DMNEdge id="DMNEdge_1sqrshg" dmnElementRef="InformationRequirement_10q46rn">
        <di:waypoint x="395" y="186" />
        <di:waypoint x="365" y="136" />
      </dmndi:DMNEdge>
      <dmndi:DMNEdge id="DMNEdge_0k2bj4f" dmnElementRef="InformationRequirement_0o1sd05">
        <di:waypoint x="243" y="186" />
        <di:waypoint x="297" y="136" />
      </dmndi:DMNEdge>
      <dmndi:DMNEdge id="DMNEdge_0lab3tk" dmnElementRef="AuthorityRequirement_01vpgc7">
        <di:waypoint x="595" y="89" />
        <di:waypoint x="430" y="94" />
      </dmndi:DMNEdge>
      <dmndi:DMNShape id="DMNShape_1wqkngl" dmnElementRef="season">
        <dc:Bounds height="80" width="180" x="110" y="186" />
      </dmndi:DMNShape>
      <dmndi:DMNEdge id="DMNEdge_0nljaz0" dmnElementRef="InformationRequirement_03uqyun">
        <di:waypoint x="180" y="316" />
        <di:waypoint x="191" y="266" />
      </dmndi:DMNEdge>
      <dmndi:DMNShape id="DMNShape_0lascth" dmnElementRef="guestCount">
        <dc:Bounds height="80" width="180" x="330" y="186" />
      </dmndi:DMNShape>
      <dmndi:DMNEdge id="DMNEdge_1hfilyn" dmnElementRef="KnowledgeRequirement_1n7aj0o">
        <di:waypoint x="591" y="364" />
        <di:waypoint x="510" y="265" />
      </dmndi:DMNEdge>
      <dmndi:DMNEdge id="DMNEdge_0fyf0ld" dmnElementRef="InformationRequirement_1138yrh">
        <di:waypoint x="369" y="363" />
        <di:waypoint x="405" y="266" />
      </dmndi:DMNEdge>
      <dmndi:DMNShape id="DMNShape_0gw7p3z" dmnElementRef="TextAnnotation_1">
        <dc:Bounds height="45" width="125" x="273" y="466" />
      </dmndi:DMNShape>
      <dmndi:DMNEdge id="DMNEdge_1xlx1bd" dmnElementRef="Association_18hoj4i">
        <di:waypoint x="366" y="408" />
        <di:waypoint x="336" y="466" />
      </dmndi:DMNEdge>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</definitions>`;

const fetchId = () => {
  const regexDMN = /[?&]id=([^&#]*)/g; // ?id=1
  const url = window.location.href;
  let matchDMNId, id;
  while ((matchDMNId = regexDMN.exec(url))) {
    id = matchDMNId[1];
    return id;
  }
};

const fetchDiagram = async (id, setWkf) => {
  if (id) {
    let res = await Service.fetchId("com.axelor.apps.bpm.db.WkfDmnModel", id);
    const wkf = (res && res.data && res.data[0]) || {};
    let { diagramXml } = wkf;
    setWkf(wkf);
    newBpmnDiagram(diagramXml);
  } else {
    newBpmnDiagram();
  }
};

const newBpmnDiagram = (rec) => {
  const diagram = rec || defaultDMNDiagram;
  openDiagram(diagram);
};

const openDiagram = (dmnXML) => {
  dmnModeler.importXML(dmnXML, function (err) {
    if (err) {
      return console.error("could not import DMN 1.1 diagram", err);
    }
    let activeEditor = dmnModeler.getActiveViewer();
    let canvas = activeEditor.get("canvas");
    canvas.zoom("fit-viewport");
  });
};

const uploadXml = () => {
  document.getElementById("inputFile").click();
};

const exportDiagram = () => {
  dmnModeler.saveXML({ format: true }, function (err, xml) {
    if (err) {
      return console.error("could not save DMN 1.1 diagram", err);
    }
    download(xml, "diagram.dmn");
  });
};

function DMNModeler() {
  const [wkfModel, setWkfModel] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const showAlert = (id, message) => {
    setMessage(message);
    let x = document.getElementById(id);
    if (!x) return;
    x.className = "show";
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
  };

  const uploadFile = (e) => {
    let files = e.target.files;
    let reader = new FileReader();
    if (files && files[0] && files[0].name && !files[0].name.includes(".dmn")) {
      setMessageType("error");
      showAlert("snackbar", "Upload dmn files only");
      return;
    }
    reader.readAsText(files[0]);
    reader.onload = (e) => {
      openDiagram(e.target.result);
    };
  };

  const onSave = () => {
    dmnModeler.saveXML({ format: true }, async function (err, xml) {
      Service.add("com.axelor.apps.bpm.db.WkfDmnModel", {
        ...wkfModel,
        diagramXml: xml,
      }).then((res) => {
        if (res && res.data && res.data[0]) {
          setWkfModel({ ...res.data[0] });
          setMessageType("success");
          showAlert("snackbar", "Saved Successfully");
        } else {
          setMessageType("error");
          showAlert(
            "snackbar",
            (res && res.data && (res.data.message || res.data.title)) ||
              "Error!"
          );
        }
      });
    });
  };

  const toolBarButtons = [
    { name: "Save", icon: SaveIcon, tooltipText: "Save", onClick: onSave },
    {
      name: "UploadXml",
      icon: UploadIcon,
      tooltipText: "Upload",
      onClick: uploadXml,
    },
    {
      name: "DownloadXml",
      icon: DownloadIcon,
      tooltipText: "Download",
      onClick: exportDiagram,
    },
  ];

  useEffect(() => {
    dmnModeler = new DmnJS({
      container: "#editor-container",
      height: "100%",
      width: "100%",
      keyboard: {
        bindTo: window,
      },
    });

    let id = fetchId();
    fetchDiagram(id, setWkfModel);
  }, []);

  return (
    <div className="App">
      <div className="test-container">
        <div className="editor-parent">
          <div className="editor-container" id="editor-container">
            <div className="toolbar-buttons">
              {toolBarButtons.map((btn) => (
                <div className="tooltip" key={btn.name}>
                  {btn.name === "UploadXml" && (
                    <input
                      id="inputFile"
                      type="file"
                      name="file"
                      onChange={uploadFile}
                      style={{ display: "none" }}
                    />
                  )}
                  <button onClick={btn.onClick} className="property-button">
                    <span className="tooltiptext">{btn.tooltipText}</span>
                    <img
                      src={btn.icon}
                      alt={btn.name}
                      style={{
                        height: 20,
                        width: 20,
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        id="snackbar"
        style={{
          backgroundColor: messageType === "error" ? "#f44336" : "#4caf50",
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default DMNModeler;
