import React, { useState, useRef, useEffect, useCallback } from "react";
import classnames from "classnames";
import AutoComplete from "@material-ui/lab/Autocomplete";
import { TextField, CircularProgress } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { translate } from "../utils";

function useDebounceEffect(handler, interval) {
  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current) {
      const timer = setTimeout(() => handler(), interval);
      return () => clearTimeout(timer);
    }
    isMounted.current = true;
  }, [handler, interval]);
}

const useStyles = makeStyles((theme) => ({
  autoComplete: {
    "& > div > label": {
      fontSize: 14,
    },
    "& > div > div": {
      paddingRight: "15px !important",
    },
    margin: "8px 0px",
    background: "white",
    border: "1px solid #ccc",
    padding: "0px 5px",
  },
  input: {
    fontSize: 14,
    color: theme.palette.common.black,
    padding: "3px 0 3px !important",
  },
  label: {
    fontSize: 14,
  },
  endAdornment: {
    top: 0,
  },
  circularProgress: {
    color: "#0A73FA",
  },
}));

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
  error = false,
  className,
  defaultValue,
  isTranslated = true,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchText, setsearchText] = useState(null);
  const [loading, setLoading] = useState(false);
  const classes = useStyles();

  const fetchOptions = useCallback(
    (searchText = "") => {
      setLoading(true);
      const criteria = [];
      if (searchText) {
        criteria.push({
          fieldName: optionLabel,
          operator: "like",
          value: searchText,
        });
      }
      if (!fetchMethod || !open) {
        setLoading(false);
        return;
      }
      return fetchMethod(criteria).then((res) => {
        if (res) {
          setOptions(res || []);
          setLoading(false);
        }
      });
    },
    [optionLabel, fetchMethod, open]
  );

  const optionDebounceHandler = React.useCallback(() => {
    if (searchText) {
      fetchOptions(searchText, criteriaIds);
    }
  }, [fetchOptions, searchText, criteriaIds]);

  useDebounceEffect(optionDebounceHandler, 500);

  useEffect(() => {
    if (!open || (propOptions && propOptions.length < 1)) {
      setOptions([]);
    }
  }, [open, propOptions]);

  useEffect(() => {
    if (open) {
      if (propOptions && propOptions.length > 0) {
        setOptions([...propOptions]);
      } else {
        fetchOptions(null, criteriaIds);
      }
    }
  }, [fetchOptions, open, criteriaIds, propOptions]);

  useEffect(() => {
    if (propOptions) {
      setLoading(true);
      setOptions(propOptions);
      setLoading(false);
    }
  }, [propOptions]);

  return (
    <AutoComplete
      classes={{
        inputFocused: classes.input,
        clearIndicator: classes.input,
        popupIndicator: classes.input,
        endAdornment: classes.endAdornment,
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
      onClick={(e) => {
        e && e.stopPropagation();
        setOpen(true);
      }}
      loading={loading}
      defaultValue={defaultValue}
      clearOnEscape
      autoComplete
      className={classnames(classes.autoComplete, className)}
      options={options}
      multiple={multiple}
      value={value}
      getOptionSelected={(option, val) => {
        if (!val) return;
        let optionName = "";
        if (name === "itemName") {
          optionName = option["label"]
            ? "label"
            : option["title"]
            ? "title"
            : option["name"]
            ? "name"
            : "name";
        } else {
          optionName = option[optionLabel]
            ? optionLabel
            : option["title"]
            ? "title"
            : "name";
        }
        return name === "view"
          ? option[optionName] === val
          : option[optionName] === val[optionName];
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
        update(values, value && value[optionLabel]);
      }}
      name={name}
      onInputChange={(e, val) => setsearchText(val)}
      renderInput={(params) => (
        <TextField
          error={error}
          helperText={error ? "Required" : ""}
          fullWidth
          {...params}
          InputProps={{
            ...(params.InputProps || {}),
            endAdornment: (
              <React.Fragment>
                {loading ? (
                  <CircularProgress
                    className={classes.circularProgress}
                    size={15}
                  />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
            onClick: (e) => e && e.stopPropagation(),
            disableUnderline: true,
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
          placeholder={placeholder || ""}
          InputLabelProps={{
            className: classes && classes.label,
          }}
          label={isLabel ? label : undefined}
        />
      )}
      getOptionLabel={(option) => {
        let optionName = "";
        if (name === "itemName") {
          optionName = option["label"]
            ? option["label"]
            : option["title"]
            ? option["title"]
            : option["name"]
            ? option["name"]
            : typeof option === "object"
            ? ""
            : option;
        } else if (
          name === "menuParent" ||
          name === "positionMenu" ||
          name === "userParentMenu" ||
          name === "userPositionMenu"
        ) {
          optionName = `${option["title"]} (${option["name"]})`;
        } else {
          optionName = option[optionLabel]
            ? option[optionLabel]
            : option["title"]
            ? option["title"]
            : typeof option === "object"
            ? ""
            : option;
        }
        return isTranslated ? translate(optionName) : optionName;
      }}
    />
  );
}
