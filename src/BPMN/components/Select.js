import React, { useState, useEffect, useCallback } from "react";
import AutoComplete from "@material-ui/lab/Autocomplete";
import { TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

function useDebounceEffect(handler, interval) {
  const isMounted = React.useRef(false);
  React.useEffect(() => {
    if (isMounted.current) {
      const timer = setTimeout(() => handler(), interval);
      return () => clearTimeout(timer);
    }
    isMounted.current = true;
  }, [handler, interval]);
}

const useStyles = makeStyles({
  autoComplete: {
    "& > div > label": {
      fontSize: 14,
    },
    margin: "8px 0px",
  },
  input: {
    fontSize: 14,
    color: "black",
  },
  label: {
    fontSize: 14,
  },
});

export default function SelectComponent({
  name,
  optionLabel = "name",
  multiple = false,
  index,
  value,
  update,
  criteriaIds,
  type,
  options: propOptions,
  label,
  fetchMethod,
  isLabel = true,
}) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = useState([]);
  const [searchText, setsearchText] = useState(null);
  const classes = useStyles();

  const fetchOptions = useCallback(
    (searchText = "") => {
      const criteria = [];
      if (searchText) {
        criteria.push({
          fieldName: optionLabel,
          operator: "like",
          value: searchText,
        });
      }
      if (!fetchMethod) return;
      return fetchMethod(criteria).then((res) => {
        if (res) {
          setOptions(res);
        }
      });
    },
    [optionLabel, fetchMethod]
  );

  const optionDebounceHandler = React.useCallback(() => {
    if (searchText) {
      fetchOptions(searchText, criteriaIds);
    }
  }, [fetchOptions, searchText, criteriaIds]);

  useDebounceEffect(optionDebounceHandler, 500);

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (propOptions && propOptions.length > 0) {
        setOptions([...propOptions]);
      } else {
        fetchOptions(null, criteriaIds);
      }
    }
  }, [fetchOptions, open, criteriaIds, propOptions]);

  return (
    <AutoComplete
      classes={{
        inputFocused: classes.input,
        clearIndicator: classes.input,
        popupIndicator: classes.input,
      }}
      size="small"
      key={index}
      open={open}
      onOpen={(e) => {
        e && e.stopPropagation();
        setOpen(true);
      }}
      onClose={(e) => {
        e && e.stopPropagation();
        setOpen(false);
      }}
      onClick={(e) => e && e.stopPropagation()}
      clearOnEscape
      autoComplete
      className={classes.autoComplete}
      options={options}
      multiple={multiple}
      value={value || {}}
      getOptionSelected={(option, val) => {
        return option === val[optionLabel];
      }}
      onChange={(e, value) => {
        let values = value;
        if (type === "multiple") {
          values =
            value &&
            value.filter(
              (val, i, self) =>
                i === self.findIndex((t) => t[optionLabel] === val[optionLabel])
            );
        }
        update(values);
      }}
      name={name}
      onInputChange={(e, val) => setsearchText(value)}
      renderInput={(params) => (
        <TextField
          fullWidth
          {...params}
          InputProps={{
            ...(params.InputProps || {}),
            onClick: (e) => e && e.stopPropagation(),
          }}
          inputProps={{
            ...(params.inputProps || {}),
            onClick: (e) => {
              e && e.stopPropagation();
              params.inputProps &&
                params.inputProps.onClick &&
                params.inputProps.onClick(e);
            },
          }}
          InputLabelProps={{
            className: classes && classes.label,
          }}
          label={isLabel ? label : undefined}
        />
      )}
      getOptionLabel={(option) => {
        if (name === "itemName") {
          return option["label"]
            ? option["label"]
            : option["title"]
            ? option["title"]
            : option["name"]
            ? option["name"]
            : typeof option === "object"
            ? ""
            : option;
        } else {
          return option[optionLabel]
            ? option[optionLabel]
            : option["title"]
            ? option["title"]
            : typeof option === "object"
            ? ""
            : option;
        }
      }}
    />
  );
}
