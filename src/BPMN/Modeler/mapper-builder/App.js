import React, { useEffect } from "react";

import "./App.css";
import Builder from "./Builder";
import BuilderProvider from "./store/context";

function AppContent({ params, onSave, handleClose, open, bpmnModeler }) {
  const [values, setValues] = React.useState(null);

  useEffect(() => {
    const value = params();
    setValues(value);
  }, [params]);

  return (
    <div className="App">
      <Builder
        onSave={onSave}
        params={values}
        handleClose={handleClose}
        open={open}
        bpmnModeler={bpmnModeler}
      />
    </div>
  );
}

export default function App({
  handleClose,
  open,
  onSave,
  params,
  bpmnModeler,
}) {
  return (
    <BuilderProvider>
      <AppContent
        onSave={onSave}
        handleClose={handleClose}
        open={open}
        params={params}
        bpmnModeler={bpmnModeler}
      />
    </BuilderProvider>
  );
}
